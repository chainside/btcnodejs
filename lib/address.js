/*
Copyright (C) 2017 chainside srl

This file is part of the btcnodejs package.

It is subject to the license terms in the LICENSE.md file found in the top-level
directory of this distribution.

No part of btcnodejs, including this file, may be copied, modified,
propagated, or distributed except according to the terms contained in the
LICENSE.md file.
*/
class Address {
  constructor(type, hash, network = undefined) {
    this.network = network ? network : net.net_name();
    this.type = type;
    this.hash = hash;
  }
  static fromBase58(base58addr) {
    const address_data = addr.fromBase58Check(base58addr);
    const hash = new ByteBuffer.fromHex(address_data.hash.toString("hex"));
    const type = Address.versions[address_data.version]["type"];
    const network = Address.versions[address_data.version]["network"];
    return new Address(type, hash, network);
  }
  toBase58() {
    const version = Address.types[this.network][this.type]["version"];
    const payload =
      this.hash.buffer instanceof ArrayBuffer ? abtb(this.hash.buffer) : this.hash.buffer;
    return addr.toBase58Check(payload, version);
  }
}
class SegwitAddress extends Address {
  constructor(type, hash, version, network = undefined) {
    super(type, hash, network);
    this.version = version;
  }
  static fromBech32(bech32addr) {
    const address_data = addr.fromBech32(bech32addr);
    const hash = new ByteBuffer.fromHex(address_data.data.toString("hex"));
    let type;
    if (bech32addr.length == 42) type = "p2wpkh";
    else if (bech32addr.length == 62) type = "p2wsh";
    else throw new TypeError("Unknown Bech32 address string length");
    const version = address_data.version;
    const network = SegwitAddress.prefixes[address_data.prefix];
    return new SegwitAddress(type, hash, version, network);
  }
  toBech32() {
    return addr.toBech32(
      $.hexToBytes(this.hash.toHex(0, this.hash.capacity())),
      this.version,
      SegwitAddress.networks[this.network]["prefix"]
    );
  }
}

Address.types = {
  mainnet: {
    p2pkh: {
      version: 0,
      prefix: "1"
    },
    p2sh: {
      version: 5,
      prefix: "3"
    }
  },
  testnet: {
    p2pkh: {
      version: 111,
      prefix: ["m", "n"]
    },
    p2sh: {
      version: 196,
      prefix: "2"
    }
  }
};
Address.versions = {
  0: {
    network: "mainnet",
    type: "p2pkh",
    prefix: "1"
  },
  5: {
    network: "mainnet",
    type: "p2sh",
    prefix: "3"
  },
  111: {
    network: "testnet",
    type: "p2pkh",
    prefix: ["m", "n"]
  },
  196: {
    network: "testnet",
    type: "p2sh",
    prefix: "2"
  }
};
SegwitAddress.prefixes = {
  bc: "mainnet",
  tb: "testnet"
};
SegwitAddress.networks = {
  mainnet: {
    prefix: "bc"
  },
  testnet: {
    prefix: "tb"
  }
};
module.exports = {
  Address,
  SegwitAddress
};
const addr = require("bitcoinjs-lib").address;
const net = require("./network");
const ByteBuffer = require("bytebuffer");
const $ = require("../tools/conversions");
const abtb = require("arraybuffer-to-buffer");
