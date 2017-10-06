const ByteBuffer = require("bytebuffer");
const $ = require("./conversions");

ByteBuffer.prototype.writeVarint = function(int, offset = undefined) {
  if (0 < int < 0xfd) {
    return { value: int, length: 1 };
  } else if (0xfd < int <= 0xffff) {
    return {
      value: parseInt("0xFD" + $.bytesToHex($.numToBytes(int, 2)), 16),
      length: 2
    };
  } else if (0xffff < int <= 0xffffffff) {
    return {
      value: parseInt("0xFE" + $.bytesToHex($.numToBytes(int, 4)), 16),
      length: 4
    };
  } else if (0xffffffff < int <= 0xffffffffffffffff) {
    return {
      value: parseInt("0xFF" + $.bytesToHex($.numToBytes(int, 8)), 16),
      length: 8
    };
  } else {
    throw ("Wrong value for varint: ", int.toString("hex"));
  }
};

ByteBuffer.prototype.parseVarint = function(offset = undefined) {
  const header = parseInt(this.toHex(offset, offset + 1), 16);
  if (0 < header < 0xfd) {
    return {
      value: header,
      length: 1
    };
  } else if (header == 0xfd) {
    return {
      value: parseInt(this.toHex(offset + 1, offset + 3)),
      length: 2
    };
  } else if (header == 0xfe) {
    return {
      value: parseInt(this.toHex(offset + 1, offset + 5)),
      length: 4
    };
  } else if (header == 0xff) {
    return {
      value: parseInt(this.toHex(offset + 1, offset + 9)),
      length: 8
    };
  } else throw ("Wrong header for varint: ", header.toString("hex"));
};
