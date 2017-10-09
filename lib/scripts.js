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
class Script {
  constructor(bytebuffer) {
    this.body = bytebuffer;
  }
  serialize() {
    return this.body;
  }
}
class ScriptSig extends Script {
  constructor(bytebuffer) {
    super(bytebuffer);
  }
  static empty() {
    return new ScriptSig(new ByteBuffer(0));
  }
  static fromAsm(asm) {
    const script = bitcoinjs.script;
    const payload = script.fromASM(asm);
    const buffer = new ByteBuffer(payload.length).append(payload);
    return new ScriptSig(buffer);
  }
  toAsm() {
    let script = bitcoinjs.script;
    let payload =
      this.body.buffer instanceof ArrayBuffer ? abtb(this.body.buffer) : this.body.buffer;
    return script.toASM(payload);
  }
  static fromHex(hex) {
    let buffer = new ByteBuffer.fromHex(hex);
    return new ScriptSig(buffer);
  }
  toHex() {
    return this.body.toHex(0, this.body.capacity());
  }
  toWitness() {
    let offset = 0;
    let witnessData = [];
    while (offset < this.body.capacity()) {
      const op = this.body.readByte(offset);
      if (op == 0) {
        witnessData.push(new ByteBuffer(0));
        offset += 1;
      }
      if (1 <= op && op <= 75) {
        witnessData.push(new ByteBuffer.fromHex(this.body.toHex(offset + 1, offset + 1 + op)));
        offset += 1 + op;
      }
      //the next byte gives the size
      if (op == 76) {
        const next_op = this.body.readByte(offset + 1);
        witnessData.push(
          new ByteBuffer.fromHex(this.body.toHex(offset + 2, offset + 2 + next_op))
        );
        offset += 2 + next_op;
      }
      //the next two bytes give the size
      if (op == 77) {
        const next_op = parseInt(this.body.toHex(offset + 1, offset + 2), 16);
        witnessData.push(
          new ByteBuffer.fromHex(this.body.toHex(offset + 3, offset + 3 + next_op))
        );
        offset += 3 + next_op;
      }
      //the next four bytes give the size
      if (op == 78) {
        const next_op = parseInt(this.body.toHex(offset + 1, offset + 4), 16);
        witnessData.push(
          new ByteBuffer.fromHex(this.body.toHex(offset + 5, offset + 5 + next_op))
        );
        offset += 5 + next_op;
      }
      if (op == 79) {
        witnessData.push(new ByteBuffer(1).append([-1]));
        offset += 2;
      }
      if (op == 81) {
        witnessData.push(new ByteBuffer(1).append([1]));
        offset += 2;
      }
      if (82 <= op && op <= 96) {
        witnessData.push(new ByteBuffer(1).append([op - 80]));
        offset += 2;
      }
    }
    return new transaction.Witness(witnessData);
  }
}
class ScriptPubKey extends Script {
  constructor(bytebuffer) {
    super(bytebuffer);
  }
  toHex() {
    return this.body.toHex(0, this.body.capacity());
  }
  static empty() {
    return new ScriptPubKey(new ByteBuffer(0));
  }
  static fromHex(hex) {
    let buffer = new ByteBuffer.fromHex(hex);
    let script = ScriptPubKey.identifyFromBuffer(buffer);
    if (!script) return new ScriptPubKey(buffer);
    return script;
  }
  static identifyFromBuffer(buffer) {
    let script = false;
    _.forEach(Script.identifiables, type => {
      let data = type.identify(buffer);
      if (data) script = new type(data.data);
    });

    return script;
  }
  toAddress(network = undefined, segwitV = undefined) {
    if (network == undefined) network = net.net_name();
    const type = segwitV != undefined ? "p2wsh" : "p2sh";
    const hash = segwitV != undefined ? this.p2wshHash() : this.p2shHash();
    const addr =
      segwitV != undefined
        ? new address.SegwitAddress(type, hash, segwitV, network)
        : new address.Address(type, hash, network);
    return addr;
  }
  p2shHash() {
    const sha256 = shajs("sha256")
      .update(this.body.toHex(0, this.body.capacity()), "hex")
      .digest("hex");
    const ripe = new ripemd160().update(sha256, "hex").digest("hex");
    return new ByteBuffer.fromHex(ripe);
  }
  p2wshHash() {
    const sha256 = shajs("sha256")
      .update(this.body.toHex(0, this.body.capacity()), "hex")
      .digest("hex");
    return new ByteBuffer.fromHex(sha256);
  }
  static requireOp(op, byte) {
    if (typeof op === "number") {
      if (byte != op) {
        return false;
      }
    } else if (Script.op_codes[op] != byte) {
      return false;
    }
    return true;
  }
}
class P2pkhScript extends ScriptPubKey {
  constructor(source) {
    let type = "p2pkh";
    let pubkeyhash;
    if (source instanceof crypto.Publickey) pubkeyhash = source.hash();
    if (source instanceof address.Address) {
      if (source.type != type)
        throw new TypeError("Invalid address type provided for p2pkh: " + source.type);
      pubkeyhash = source.hash;
    }
    if (source instanceof ByteBuffer) pubkeyhash = source;

    const buffer = new ByteBuffer(25);
    buffer
      .append($.numToBytes(Script.op_codes["OP_DUP"], 1))
      .append($.numToBytes(Script.op_codes["OP_HASH160"], 1))
      .append($.numToBytes(20, 1))
      .append(pubkeyhash.reset())
      .append($.numToBytes(Script.op_codes["OP_EQUALVERIFY"], 1))
      .append($.numToBytes(Script.op_codes["OP_CHECKSIG"], 1));
    super(buffer);
    this.type = type;
    this.pubkeyhash = pubkeyhash;
  }
  getAddress() {
    return new address.Address(this.type, this.pubkeyhash);
  }
  static identify(script) {
    const buf = script.copy(0, script.capacity());

    if (
      ScriptPubKey.requireOp("OP_DUP", buf.readUint8(0)) &&
      ScriptPubKey.requireOp("OP_HASH160", buf.readUint8(1)) &&
      ScriptPubKey.requireOp(20, buf.readUint8(2)) &&
      ScriptPubKey.requireOp("OP_EQUALVERIFY", buf.readUint8(23)) &&
      ScriptPubKey.requireOp("OP_CHECKSIG", buf.readUint8(24)) &&
      script.capacity() == 25
    )
      return { data: buf.copy(3, 23) };

    return false;
  }
}
class P2wpkhV0Script extends ScriptPubKey {
  constructor(source) {
    let type = "p2wpkh";
    let pubkeyhash;
    if (source instanceof crypto.Publickey) pubkeyhash = source.hash();
    if (source instanceof ByteBuffer) pubkeyhash = source;
    if (source instanceof address.SegwitAddress) {
      if (source.type != type)
        throw new TypeError("Invalid address type provided for p2wpkh: " + source.type);
      pubkeyhash = source.hash;
    }
    const buffer = new ByteBuffer(22);
    buffer
      .append($.numToBytes(Script.op_codes["OP_0"], 1))
      .append($.numToBytes(20, 1))
      .append($.hexToBytes(pubkeyhash.toHex(0, pubkeyhash.capacity())));
    super(buffer);
    this.type = type;
    this.pubkeyhash = pubkeyhash;
  }
  static fromHex(hex) {
    let buffer = new ByteBuffer.fromHex(hex);
    let sc = new P2wpkhV0Script(buffer.copy(2, buffer.capacity()));
    return sc;
  }
  getAddress() {
    return new address.SegwitAddress("p2wpkh", this.pubkeyhash, 0);
  }
  getScriptCode() {
    const sc = new P2pkhScript(this.pubkeyhash);

    return StackData.getPushOp($.hexToBytes(sc.toHex()));
  }
  static identify(script) {
    const buf = script.copy(0, script.capacity());
    if (
      ScriptPubKey.requireOp("OP_0", buf.readUint8(0)) &&
      ScriptPubKey.requireOp(20, buf.readUint8(1)) &&
      script.capacity() == 22
    )
      return { data: buf.copy(2, 22) };

    return false;
  }
}
class P2shScript extends ScriptPubKey {
  constructor(source) {
    let type = "p2sh";
    let scripthash;
    if (source instanceof ScriptPubKey) scripthash = source.p2shHash();
    if (source instanceof address.Address) {
      if (source.type != type)
        throw new TypeError("Invalid address type provided for p2sh: " + source.type);
      scripthash = source.hash;
    }
    if (source instanceof ByteBuffer) scripthash = source;
    const buffer = new ByteBuffer(23);
    buffer
      .append($.numToBytes(Script.op_codes["OP_HASH160"], 1))
      .append($.numToBytes(20, 1))
      .append(scripthash.reset())
      .append($.numToBytes(Script.op_codes["OP_EQUAL"], 1));

    super(buffer);
    this.type = type;
    this.scripthash = scripthash;
  }
  getAddress() {
    return new address.Address(this.type, this.scripthash);
  }
  static identify(script) {
    const buf = script.copy(0, script.capacity());
    if (
      ScriptPubKey.requireOp("OP_HASH160", buf.readUint8(0)) &&
      ScriptPubKey.requireOp(20, buf.readUint8(1)) &&
      ScriptPubKey.requireOp("OP_EQUAL", buf.readUint8(22)) &&
      script.capacity() == 23
    )
      return { data: buf.copy(2, 22) };

    return false;
  }
}
class P2wshV0Script extends ScriptPubKey {
  constructor(source) {
    let type = "p2wsh";
    let scripthash;
    if (source instanceof ScriptPubKey) scripthash = source.p2shHash();
    if (source instanceof address.SegwitAddress) {
      if (source.type != type)
        throw new TypeError("Invalid address type provided for p2wsh: " + source.type);

      scripthash = source.hash;
    }
    if (source instanceof ByteBuffer) scripthash = source;
    const buffer = new ByteBuffer(34);
    buffer
      .append($.numToBytes(Script.op_codes["OP_0"], 1))
      .append($.numToBytes(32, 1))
      .append(scripthash);

    super(buffer);
    this.type = type;
    this.scripthash = scripthash;
  }
  getAddress() {
    return new address.SegwitAddress("p2wsh", this.scripthash, 0);
  }
  static identify(script) {
    const buf = script.copy(0, script.capacity());
    if (
      ScriptPubKey.requireOp("OP_0", buf.readUint8(0)) &&
      ScriptPubKey.requireOp(32, buf.readUint8(1)) &&
      script.capacity() == 34
    )
      return { data: buf.copy(2, 34) };

    return false;
  }
}
class IfElseScript extends ScriptPubKey {
  constructor(source) {
    let if_script, else_script;
    if (source instanceof Array) {
      if (!(source[0] instanceof ScriptPubKey && source[1] instanceof ScriptPubKey))
        throw new TypeError("Invalid objects to build an If-Else script");
      if_script = source[0];
      else_script = source[1];
    }

    const buffer = new ByteBuffer(if_script.body.capacity() + else_script.body.capacity() + 3);
    buffer
      .append($.numToBytes(Script.op_codes["OP_IF"], 1))
      .append(if_script.serialize().flip())
      .append($.numToBytes(Script.op_codes["OP_ELSE"], 1))
      .append(else_script.serialize().flip())
      .append($.numToBytes(Script.op_codes["OP_ENDIF"], 1));

    super(buffer);
    this.if_script = if_script;
    this.else_script = else_script;
    this.type = "if{" + if_script.type + "}else{" + else_script.type + "}";
  }
}
class RelativeTimelockScript extends ScriptPubKey {
  constructor(source) {
    let sequence, locked_script;
    if (source instanceof Array) {
      if (!(source[1] instanceof transaction.Sequence && source[0] instanceof ScriptPubKey))
        throw new TypeError("Invalid objects provided to build a RelativeTimelockScript");
      sequence = source[1];
      locked_script = source[0];
    }
    const push_seq = StackData.getPushOp($.numToBytes(sequence.n, $.bytesLen(sequence.n)));
    const buffer = new ByteBuffer(push_seq.length + locked_script.body.capacity() + 2);

    buffer
      .append(push_seq)
      .append($.numToBytes(Script.op_codes["OP_CHECKSEQUENCEVERIFY"], 1))
      .append($.numToBytes(Script.op_codes["OP_DROP"], 1))
      .append(locked_script.serialize().flip());
    super(buffer);
    this.sequence = sequence;
    this.locked_script = locked_script;
    this.type = "RelativeTimelock " + this.locked_script.type;
  }
}
class MultiSigScript extends ScriptPubKey {
  constructor(source) {
    let m, n, pubkeys;
    if (source instanceof Array) {
      m = source[0];
      pubkeys = _.slice(source, 1, source.length - 1);
      n = source[source.length - 1];
      if (n != pubkeys.length)
        throw new TypeError(
          "The number of pubkeys must be equal to n,  " +
            pubkeys.length +
            "pubkeys provided, while n is " +
            n
        );
    }
    const push_m = StackData.opFromInt(m);
    const push_n = StackData.opFromInt(n);

    const serializedKeys = [];
    _.forEach(pubkeys, key => serializedKeys.push(key.serialize()));
    let serializedDim = 0;
    _.forEach(serializedKeys, key => (serializedDim += key.capacity()));
    const buffer = new ByteBuffer(
      push_m.length + push_n.length + serializedDim + pubkeys.length + 1
    );
    buffer.append(push_m);
    _.forEach(serializedKeys, function(key) {
      buffer.append($.numToBytes(key.capacity(), 1));
      buffer.append(key);
    });
    buffer.append(push_n).append($.numToBytes(Script.op_codes["OP_CHECKMULTISIG"], 1));
    super(buffer);
    this.type = "multisig";
    this.m = m;
    this.n = n;
    this.pubkeys = pubkeys;
  }

  static identify(script) {
    const buf = script.copy(0, script.capacity());
    const req = buf.readUint8(0);
    const keys = buf.readUint8(script.capacity() - 2);
    let read = 0;
    for (var i = 1; i < keys; i++) {
      let keysize = buf.readUint8(i);
      if (keysize != 33 && keysize != 65) return false;
      i += keysize;
      read += 1 + keysize;
    }
    if (!ScriptPubKey.requireOp("OP_CHECKMULTISIG", buf.readUint8(script.capacity() - 1)))
      return false;
    if (read + 3 != script.capacity()) return false;
    return true;
  }
}
class StackData {
  static getPushOp(bytes) {
    const len = bytes.length;
    if (len == 0) return [0];
    if (len == 1) {
      if (bytes[0] == 0)
        throw new TypeError("Trying to push 0x00 as a literal instead of empty array");
      if (1 <= bytes[0] && bytes[0] <= 16)
        return $.numToBytes(80 + bytes[0], $.bytesLen(80 + bytes[0]));
    }

    if (len <= 75) return _.concat($.numToBytes(len, $.bytesLen(len)), bytes);
    else {
      let size;
      if (len <= 0xff) size = 1;
      else if (len <= 0xffff) size = 2;
      else if (len <= 0xffffffff) size = 4;
      else if (len > 0xffffffff) throw new RangeError("Data length too big to push");
      return _.concat(
        $.numToBytes(Script.op_codes["OP_PUSHDATA" + size], 1),
        $.numToBytes(len, size),
        bytes
      );
    }
  }
  static opFromInt(int) {
    if (int == 0) return [0];
    const sign = int < 0 ? true : false;
    const absolute = $.numToBytes(Math.abs(int), Math.ceil($.bytesLen(Math.abs(int))));
    if (absolute[absolute.length - 1] & (1 << 7)) absolute.append(sign ? 1 << 7 : 0);
    else absolute[absolute.length - 1] |= sign ? 1 << 7 : 0;
    return StackData.getPushOp(absolute);
  }
}
Script.op_codes = {
  OP_0: 0,
  OP_PUSHDATA1: 76,
  OP_PUSHDATA2: 77,
  OP_PUSHDATA4: 78,
  OP_1: 81,
  OP_IF: 99,
  OP_ELSE: 103,
  OP_DROP: 117,
  OP_DUP: 118,
  OP_ENDIF: 104,
  OP_EQUAL: 135,
  OP_EQUALVERIFY: 136,
  OP_HASH160: 169,
  OP_CHECKSIG: 172,
  OP_CHECKMULTISIG: 174,
  OP_HASH256: 170,
  OP_CHECKSEQUENCEVERIFY: 178
};
Script.identifiables = [P2pkhScript, P2shScript, P2wshV0Script, P2wpkhV0Script];
module.exports = {
  ScriptSig,
  ScriptPubKey,
  P2pkhScript,
  P2shScript,
  P2wpkhV0Script,
  P2wshV0Script,
  RelativeTimelockScript,
  MultiSigScript,
  IfElseScript,
  StackData,
  Script
};
const ByteBuffer = require("bytebuffer");
const bitcoinjs = require("bitcoinjs-lib");
const $ = require("../tools/conversions");
const net = require("./network");
const shajs = require("sha.js");
const ripemd160 = require("ripemd160");
const address = require("./address");
const crypto = require("./crypto");
const transaction = require("./transaction");
const _ = require("lodash");
const abtb = require("arraybuffer-to-buffer");
