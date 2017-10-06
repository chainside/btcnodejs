"use strict";
const BN = require("bn.js");
function swapHex(value) {
  let s = value.toString(16);
  s = s.replace(/^(.(..)*)$/, "0$1");
  var a = s.match(/../g);
  a.reverse();
  var s2 = a.join("");
  return s2;
}

function numToBytes(num, bytes) {
  if (bytes === undefined) bytes = 8;
  if (bytes == 0) return [];
  else return [num % 256].concat(numToBytes(Math.floor(num / 256), bytes - 1));
}

function numToVarInt(num) {
  if (num < 253) return [num];
  else if (num < 65536) return [253].concat(numToBytes(num, 2));
  else if (num < 4294967296) return [254].concat(numToBytes(num, 4));
  else return [253].concat(numToBytes(num, 8));
}

function hexToBytes(hex) {
  for (var bytes = [], c = 0; c < hex.length; c += 2)
    bytes.push(parseInt(hex.substr(c, 2), 16));
  return bytes;
}

function bytesToHex(bytes) {
  for (var hex = [], i = 0; i < bytes.length; i++) {
    hex.push((bytes[i] >>> 4).toString(16));
    hex.push((bytes[i] & 0xf).toString(16));
  }
  return hex.join("");
}
function bytesLen(num) {
  return Math.ceil(num.toString(2).length / 8);
}
function bnmodexp(a, b, n) {
  if (!BN.isBN(a)) a = new BN(a);
  if (!BN.isBN(b)) b = new BN(b);
  if (!BN.isBN(n)) n = new BN(n);
  a = a.mod(n);
  let result = new BN(1);
  let x = a;
  while (!b.isZero()) {
    let leastSignificantBit = b.mod(new BN(2));
    b = b.div(new BN(2));
    if (leastSignificantBit.eq(new BN(1))) {
      result = result.mul(x).mod(n);
    }
    x = x.mul(x).mod(n);
  }
  return result;
}

module.exports = {
  swapHex,
  numToBytes,
  numToVarInt,
  hexToBytes,
  bytesToHex,
  bnmodexp,
  bytesLen
};
