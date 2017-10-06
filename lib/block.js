/*
Copyright (C) 2017 chainside srl

This file is part of the btcnodejs package.

It is subject to the license terms in the LICENSE.md file found in the top-level
directory of this distribution.

No part of btcnodejs, including this file, may be copied, modified,
propagated, or distributed except according to the terms contained in the
LICENSE.md file.
*/
class BlockHeader {
  constructor(version, prev_block, merkle_root, timestamp, bits, nonce) {
    this.version = version;
    this.prev_block = prev_block;
    this.merkle_root = merkle_root;
    this.timestamp = timestamp;
    this.bits = bits;
    this.nonce = nonce;
  }
  static fromHex(hex) {
    const buffer = new ByteBuffer.fromHex(hex);
    return BlockHeader.deserialize(buffer);
  }
  serialize() {
    let buffer = new ByteBuffer(80);
    buffer.append($.numToBytes(this.version, 4));
    buffer.append($.hexToBytes(this.prev_block).reverse());
    buffer.append($.hexToBytes(this.merkle_root).reverse());
    buffer.append($.numToBytes(this.timestamp, 4));
    buffer.append($.numToBytes(this.bits, 4));
    buffer.append($.numToBytes(this.nonce, 4));
    return buffer;
  }
  static deserialize(bytebuffer) {
    const buffer = bytebuffer.LE();
    let offset = 0;
    const version = buffer.readInt32(offset);
    offset += 4;
    const prev_block = $.swapHex(buffer.toHex(offset, offset + 32));
    offset += 32;
    const merkle_root = $.swapHex(buffer.toHex(offset, offset + 32));
    offset += 32;
    const timestamp = buffer.readInt32(offset);
    offset += 4;
    const bits = buffer.readInt32(offset);
    offset += 4;
    const nonce = buffer.readInt32(offset);
    offset += 4;

    return new BlockHeader(version, prev_block, merkle_root, timestamp, bits, nonce);
  }
  blockHash() {
    const serialized = this.serialize();
    const hex = serialized.toHex(0, serialized.capacity());
    return $.swapHex(
      shajs("sha256")
        .update(
          shajs("sha256")
            .update(hex, "hex")
            .digest("hex"),
          "hex"
        )
        .digest("hex")
    );
  }
}
module.exports = {
  BlockHeader
};
const $ = require("../tools/conversions");
const _ = require("lodash");
const ByteBuffer = require("bytebuffer");
const shajs = require("sha.js");
