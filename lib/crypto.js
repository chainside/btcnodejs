/*
Copyright (C) 2017 chainside srl

This file is part of the btcnodejs package.

It is subject to the license terms in the LICENSE.md file found in the top-level
directory of this distribution.

No part of btcnodejs, including this file, may be copied, modified,
propagated, or distributed except according to the terms contained in the
LICENSE.md file.
*/
"use strict";
class Privatekey {
  constructor(bytebuffer) {
    this.body = bytebuffer;
  }
  static fromHex(hex) {
    const buffer = new ByteBuffer.fromHex(hex);
    return new Privatekey(buffer);
  }
  toHex() {
    return this.body.toHex(0, this.body.capacity());
  }

  serialize() {
    return this.body;
  }
  getPublic(compressed = true) {
    const ec = new EC("secp256k1");
    const key = ec.keyFromPrivate(this.body.toHex(0, this.body.capacity()), "hex");
    const pub = key.getPublic();
    const uncompressed_hex = pub.x.toString("hex", 64) + pub.y.toString("hex", 64);
    const buffer = new ByteBuffer.fromHex(uncompressed_hex).prepend("04", "hex", 0);
    const uncompressed_pub = new Publickey(buffer);
    if (compressed) return new Publickey(uncompressed_pub.compressed);
    else return uncompressed_pub;
  }
  sign(message) {
    let ec = new EC("secp256k1");
    let key = ec.keyFromPrivate(this.body.toHex(0, this.body.capacity()), "hex");
    let sig = key.sign(message);

    let highest_order = new BN(
      "7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0",
      16
    );
    if (sig.s.gt(highest_order)) {
      let order = new BN(
        "fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141",
        16
      );
      sig.s = order.sub(sig.s);
    }
    return sig;
  }
  signDER(message) {
    return $.bytesToHex(this.sign(message).toDER());
  }
  toWIF(compressed = false) {
    let key = this.body.clone();
    if (compressed)
      key = key.append("01", "hex", this.body.capacity()).copy(0, this.body.capacity() + 1);
    let v_key =
      net.net_name() == "mainnet" ? key.prepend("80", "hex", 0) : key.prepend("ef", "hex", 0);
    let checksum = shajs("sha256")
      .update(
        shajs("sha256")
          .update(v_key.toHex(0, v_key.limit), "hex")
          .digest("hex"),
        "hex"
      )
      .digest("hex")
      .substring(0, 8);
    let extended_key = v_key.append(checksum, "hex", v_key.limit).copy(0, v_key.limit + 4);
    let payload =
      extended_key.buffer instanceof ArrayBuffer
        ? abtb(extended_key.buffer)
        : extended_key.buffer;
    let wif = bs58.encode(payload);
    return wif;
  }
  static fromWIF(wif_string) {
    if (!(wif_string.length >= 51 && wif_string.length <= 52))
      throw new Error("Invalid WIF string");
    const decoded = bs58check.decode(wif_string);
    const wif_key = new ByteBuffer(decoded.length).append(decoded);
    return new Privatekey(wif_key.copy(1, 33));
  }
  static fromBip32(bip_string) {
    if (bip_string.substring(0, 4) != "tprv" && bip_string.substring(0, 4) != "xprv")
      throw new TypeError("Key prefix is invalid");
    const decoded = new ByteBuffer.fromHex(bs58check.decode(bip_string).toString("hex"));
    if (decoded.readByte(decoded.capacity() - 33) != 0)
      throw new TypeError("Byte -33 expected to be 0");

    return new Privatekey(decoded.copy(decoded.capacity() - 32, decoded.capacity()));
  }
}
class Publickey {
  constructor(bytebuffer) {
    this.type = Publickey.types[bytebuffer.toHex(0, 1)];
    if (this.type == "uncompressed") {
      this.uncompressed = bytebuffer;
      const header =
        parseInt(
          this.uncompressed.toHex(
            this.uncompressed.capacity() - 1,
            this.uncompressed.capacity()
          ),
          16
        ) % 2
          ? "03"
          : "02";
      this.compressed = new ByteBuffer.fromHex(header + this.uncompressed.toHex(1, 33));
    } else {
      this.compressed = bytebuffer;
      this.uncompressed = Publickey.uncompress(bytebuffer);
    }
  }
  hash() {
    const to_hash = this.type == "uncompressed" ? this.uncompressed : this.compressed;
    const sha256 = shajs("sha256")
      .update(to_hash.toHex(), "hex")
      .digest("hex");
    const ripe = new ripemd160().update(sha256, "hex").digest("hex");
    return new ByteBuffer.fromHex(ripe);
  }
  static fromBip32(bip_string) {
    if (bip_string.substring(0, 4) != "tpub" && bip_string.substring(0, 4) != "xpub")
      throw new TypeError("Key prefix is invalid");
    const decoded = new ByteBuffer.fromHex(bs58check.decode(bip_string).toString("hex"));
    return new Publickey(decoded.copy(decoded.capacity() - 33, decoded.capacity()));
  }
  static fromHex(hex) {
    let buffer = new ByteBuffer.fromHex(hex);
    return new Publickey(buffer);
  }
  toHex(compressed = true) {
    if (compressed) return this.compressed.toHex(0, this.compressed.capacity());
    else return this.uncompressed.toHex(0, this.compressed.capacity());
  }
  static uncompress(pubkey) {
    const p = new BN("fffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f", 16);
    const header = pubkey.readByte(0);
    const body = pubkey.copy(1, pubkey.capacity());
    const parity = header - 2;
    const alpha = $.bnmodexp(new BN(body.toHex(), 16), 3, p)
      .add(new BN(7))
      .mod(p);
    let y = $.bnmodexp(alpha, p.add(new BN(1)).div(new BN(4)), p);
    if (!y.mod(new BN(2)).eq(new BN(parity))) y = y.neg().umod(p);
    let buf = y.toArrayLike(Buffer, "big", 32);
    const uncompressed = new ByteBuffer(body.capacity() + buf.length + 1);
    return uncompressed
      .append("04", "hex")
      .append(body)
      .append(buf);
  }
  toAddress(network = undefined, segwit = false) {
    if (network == undefined) network = net.net_name();
    const type = segwit ? "p2wpkh" : "p2pkh";
    return new Address(type, this.hash(), network);
  }
  serialize() {
    return this.type == "uncompressed" ? this.uncompressed : this.compressed;
  }
}
Privatekey.bip32 = {
  testnet: "tprv",
  mainnet: "xprv"
};
Publickey.types = {
  "02": "even",
  "03": "odd",
  "04": "uncompressed"
};
Publickey.wif = {
  K: "compressed",
  L: "compressed",
  "5": "uncompressed",

  c: "compressed",
  "9": "uncompressed"
};
module.exports = {
  Privatekey,
  Publickey
};
const ByteBuffer = require("bytebuffer");
const EC = require("elliptic").ec;
const $ = require("../tools/conversions");
const net = require("./network");
const shajs = require("sha.js");
const bs58 = require("bs58");
const bs58check = require("bs58check");
const BN = require("bn.js");
const ripemd160 = require("ripemd160");
const Address = require("./address").Address;
const abtb = require("arraybuffer-to-buffer");
