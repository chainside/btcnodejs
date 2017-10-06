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
class Transaction {
  constructor(version, inputs, outputs, locktime, segwit = false) {
    this.version = version;
    this.inputs = inputs;
    this.outputs = outputs;
    this.locktime = locktime;
    this.segwit = segwit;
    this.txid = this.segwit ? this.segwitId() : this.hash();
    if (new.target === Transaction) {
      Object.freeze(this);
    }
  }
  toJSON() {
    return JSON.stringify({
      txid: this.txid,
      outputs: _.forEach(this.outputs, out => out.toJSON()),
      inputs: _.forEach(this.inputs, input => input.toJSON()),
      locktime: this.locktime.n,
      version: this.version
    });
  }
  hash() {
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
  segwitId() {
    const serialized = this.serialize(false);
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
  static fromHex(hex) {
    const buffer = new ByteBuffer.fromHex(hex);
    return Transaction.deserialize(buffer);
  }
  toHex() {
    const serialized = this.serialize();
    return serialized.toHex(0, serialized.capacity());
  }
  serialize(segwit = this.segwit) {
    let ser_ins = [],
      ser_outs = [];
    let ser_ins_dim = 0,
      ser_outs_dim = 0;
    let ser_witnesses = [];
    let ser_witnesses_dim = 0;
    _.forEach(this.inputs, input => {
      const ser_in = input.serialize();
      ser_ins_dim += ser_in.capacity();
      ser_ins.push(ser_in);
      if (this.segwit && segwit) {
        const ser_wit = input.witness.serialize();
        ser_witnesses_dim += ser_wit.capacity();
        ser_witnesses.push(ser_wit);
      }
    });
    _.forEach(this.outputs, output => {
      const ser_out = output.serialize();
      ser_outs_dim += ser_out.capacity();
      ser_outs.push(ser_out);
    });

    var dim =
      ser_ins_dim +
      ser_outs_dim +
      8 +
      $.numToVarInt(this.inputs.length).length +
      $.numToVarInt(this.outputs.length).length;

    if (this.segwit && segwit) dim += ser_witnesses_dim + 2;
    let buffer = new ByteBuffer(dim);
    buffer.append($.numToBytes(this.version, 4));
    if (this.segwit && segwit) buffer.append($.numToBytes(0, 1)).append($.numToBytes(1, 1));
    buffer.append($.numToVarInt(this.inputs.length));
    _.forEach(ser_ins, ser_in => buffer.append(ser_in.flip()));
    buffer.append($.numToVarInt(this.outputs.length));
    _.forEach(ser_outs, ser_out => buffer.append(ser_out.flip()));
    if (this.segwit && segwit)
      _.forEach(ser_witnesses, ser_wit => buffer.append(ser_wit.flip()));
    buffer.append($.numToBytes(this.locktime.n, 4));
    return buffer;
  }
  toMutable() {
    return new MutableTransaction(
      this.version,
      this.inputs,
      this.outputs,
      this.locktime,
      this.segwit
    );
  }
  static deserialize(bytebuffer) {
    let segwit = false;
    let buffer = bytebuffer.LE();
    let offset = 0;
    let ins = [],
      outs = [];
    const version = buffer.readInt32(offset);

    offset += 4;
    var n_ins = buffer.parseVarint(offset);
    offset += n_ins.length;
    if (n_ins.value == 0) {
      const flag = buffer.readByte(offset);

      offset += 1;
      if (flag != 1) throw "Transaction is marked as segwit but flag is invalid";
      segwit = true;
      n_ins = buffer.parseVarint(offset);
      offset += n_ins.length;
    }

    for (var i = 0; i < n_ins.value; i++) {
      const d_in = Transaction.deserialize_input(buffer, offset);
      ins.push(d_in.input);
      offset += d_in.read;
    }
    const n_outs = buffer.parseVarint(offset);
    offset += n_outs.length;
    for (var i = 0; i < n_outs.value; i++) {
      const d_out = Transaction.deserialize_output(buffer, offset);
      outs.push(d_out.output);
      offset += d_out.read;
    }

    if (segwit) {
      const witnesses = [];
      for (var i = 0; i < n_ins.value; i++) {
        var n_data = buffer.parseVarint(offset);
        offset += n_data.length;
        var wit_data = [];
        for (var i = 0; i < n_data.value; i++) {
          let data_length = buffer.parseVarint(offset);
          offset += data_length.length;
          let data = new ByteBuffer.fromHex(buffer.toHex(offset, offset + data_length.value));
          offset += data_length.value;
          wit_data.push(data);
        }
        witnesses.push(new Witness(wit_data));
      }
      _.forEach(ins, (input, index) => (input.witness = witnesses[index]));
    }
    let locktime = new Locktime(buffer.readInt32(offset));
    offset += 4;
    if (buffer.capacity() != offset) throw new Error("Incomplete tx deserialization");
    return new Transaction(version, ins, outs, locktime, segwit);
  }
  static deserialize_input(buffer, offset) {
    let i_offset = offset;
    const txid = $.swapHex(buffer.toHex(offset, offset + 32));
    offset += 32;
    const vout = buffer.readInt32(offset);
    offset += 4;
    const script_len = buffer.parseVarint(offset);
    offset += script_len.length;
    const script_sig = scripts.ScriptSig.fromHex(
      buffer.toHex(offset, offset + script_len.value)
    );
    offset += script_len.value;
    const sequence = new Sequence(buffer.readUint32(offset));
    offset += 4;
    return {
      input: new Input(txid, vout, script_sig, sequence),
      read: offset - i_offset
    };
  }
  static deserialize_output(buffer, offset) {
    let i_offset = offset;
    const amount = buffer.readInt64(offset);
    offset += 8;
    const script_len = buffer.parseVarint(offset);
    offset += script_len.length;
    const script = scripts.ScriptPubKey.fromHex(
      buffer.toHex(offset, offset + script_len.value)
    );
    offset += script_len.value;
    return {
      output: new Output(amount, script),
      read: offset - i_offset
    };
  }
  getDigestPreImage(index, prev_script, sighash = new Sighash("ALL")) {
    let throwaway = this.toMutable();
    for (var i = 0; i < throwaway.inputs.length; i++) {
      if (i == index) throwaway.inputs[i].scriptSig = prev_script;
      else throwaway.inputs[i].scriptSig = scripts.ScriptSig.empty();
    }
    if (sighash.sighash in { NONE: 0x02, SINGLE: 0x03 }) {
      if (sighash.sighash == "NONE") throwaway.outputs = [];
      else if (sighash.sighash == "SINGLE") {
        if (index >= throwaway.outputs.length)
          throw new RangeError(
            "Index greater than outputs number while SIGHASH SINGLE was chosen"
          );
        let matching_out = throwaway.outputs[index];
        throwaway.outputs = [];
        for (var j = 0; j < index; j++) {
          throwaway.outputs.append(
            new Output(0xffffffffffffffff, scripts.ScriptPubKey.empty())
          );
        }
        throwaway.outputs.append(matching_out);
        for (var j = 0; j < index; j++) {
          if (j != index) throwaway.inputs[i].sequence = 0;
        }
      }
    }

    if (sighash.anyonecanpay) throwaway.inputs = [throwaway.inputs[index]];
    const serialized = throwaway.serialize();
    const buffer = new ByteBuffer(serialized.capacity() + 4);
    buffer.append(serialized.reset()).append($.numToBytes(Sighash.types[sighash.sighash], 4));
    return buffer;
  }
  getDigest(index, prev_script, sighash = new Sighash("ALL")) {
    const d_preimage = this.getDigestPreImage(index, prev_script, sighash);
    const preimage = d_preimage.toHex(0, d_preimage.capacity());
    const digest = shajs("sha256")
      .update(
        shajs("sha256")
          .update(preimage, "hex")
          .digest("hex"),
        "hex"
      )
      .digest("hex");
    return digest;
  }
  getSegwitDigestPreImage(index, prev_script, prev_amount, sighash = new Sighash("ALL")) {
    let hash_prevouts = new ByteBuffer(32);
    let hash_sequence = new ByteBuffer(32);
    let hash_outputs = new ByteBuffer(32);
    if (!sighash.anyonecanpay) hash_prevouts = this.hashPrevouts();
    if (!sighash.anyonecanpay && !(sighash.sighash in { NONE: 0x02, SINGLE: 0x03 }))
      hash_sequence = this.hashSequence();
    if (!(sighash.sighash in { NONE: 0x02, SINGLE: 0x03 })) hash_outputs = this.hashOutputs();
    else if (sighash.sighash == "SINGLE" && index < this.outputs.length) {
      let tohash_buf = this.outputs[index].serialize();
      let tohash = tohash_buf.toHex(0, tohash_buf.capacity());
      hash_outputs = shajs("sha256")
        .update(
          shajs("sha256")
            .update(tohash, "hex")
            .digest("hex"),
          "hex"
        )
        .digest("hex");
    }
    let script_code;

    if (prev_script instanceof scripts.P2wpkhV0Script)
      script_code = prev_script.getScriptCode();
    else
      script_code = scripts.StackData.getPushOp(
        $.hexToBytes(prev_script.toHex(0, prev_script.body.capacity()))
      );

    const curr_in = this.inputs[index];
    let dim =
      28 +
      $.hexToBytes(hash_prevouts.toHex(0, hash_prevouts.capacity())).length +
      $.hexToBytes(hash_sequence.toHex(0, hash_sequence.capacity())).length +
      $.hexToBytes(hash_outputs.toHex(0, hash_outputs.capacity())).length +
      $.hexToBytes(curr_in.txid).length +
      script_code.length;

    const buffer = new ByteBuffer(dim);
    buffer
      .append($.numToBytes(this.version, 4))
      .append($.hexToBytes(hash_prevouts.toHex(0, hash_prevouts.capacity())))
      .append($.hexToBytes(hash_sequence.toHex(0, hash_sequence.capacity())))
      .append($.hexToBytes(curr_in.txid).reverse())
      .append($.numToBytes(curr_in.out, 4))
      .append(script_code)
      .append($.numToBytes(prev_amount, 8))
      .append($.numToBytes(curr_in.sequence.n, 4))
      .append($.hexToBytes(hash_outputs.toHex(0, hash_outputs.capacity())))
      .append($.numToBytes(this.locktime.n, 4))
      .append($.numToBytes(Sighash.types[sighash.sighash], 4));

    return buffer;
  }
  getSegwitDigest(index, prev_script, prev_amount, sighash = new Sighash("ALL")) {
    const preimage = this.getSegwitDigestPreImage(index, prev_script, prev_amount, sighash);
    const hex = preimage.toHex(0, preimage.capacity());
    const digest = shajs("sha256")
      .update(
        shajs("sha256")
          .update(hex, "hex")
          .digest("hex"),
        "hex"
      )
      .digest("hex");
    return digest;
  }
  hashPrevouts() {
    let data = [];
    _.forEach(this.inputs, input => {
      let txid = $.hexToBytes(input.txid).reverse();
      let vout = $.numToBytes(input.out, 4);
      data.push(txid);
      data.push(vout);
    });
    const hex = $.bytesToHex(_.flatten(data));
    const hash = shajs("sha256")
      .update(
        shajs("sha256")
          .update(hex, "hex")
          .digest("hex"),
        "hex"
      )
      .digest("hex");
    const buffer = new ByteBuffer.fromHex(hash);
    return buffer;
  }
  hashSequence() {
    let data = [];
    _.forEach(this.inputs, input => {
      let sequence = $.numToBytes(input.sequence.n, 4);

      data.push(sequence);
    });
    const hex = $.bytesToHex(_.flatten(data));
    const hash = shajs("sha256")
      .update(
        shajs("sha256")
          .update(hex, "hex")
          .digest("hex"),
        "hex"
      )
      .digest("hex");
    const buffer = new ByteBuffer.fromHex(hash);
    return buffer;
  }
  hashOutputs() {
    let data = [];
    _.forEach(this.outputs, output => {
      let ser_buf = output.serialize();
      let ser_out = $.hexToBytes(ser_buf.toHex(0, ser_buf.capacity()));

      data.push(ser_out);
    });
    const hex = $.bytesToHex(_.flatten(data));
    const hash = shajs("sha256")
      .update(
        shajs("sha256")
          .update(hex, "hex")
          .digest("hex"),
        "hex"
      )
      .digest("hex");
    const buffer = new ByteBuffer.fromHex(hash);
    return buffer;
  }
}
class MutableTransaction extends Transaction {
  constructor(version, inputs, outputs, locktime, segwit = false) {
    super(version, inputs, outputs, locktime, (segwit = false));
  }
  toImmutable() {
    return new Transaction(
      this.version,
      this.inputs,
      this.outputs,
      this.locktime,
      this.segwit
    );
  }
  spend(txouts, solvers) {
    if (this.segwit) return this.spendSegwit(txouts, solvers);
    else return this.spendClassic(txouts, solvers);
  }
  spendSingle(index, txout, solver) {
    const sighashes = solver.getSighashes();
    const prev_script = solver.hasPrevScript() ? solver.getPrevScript() : txout.scriptPubKey;
    let solveData;
    if (sighashes.length == 0) {
      solveData = solver.solve();
    } else if (sighashes.length == 1) {
      let digest = this.getDigest(index, prev_script, sighashes[0]);
      solveData = solver.solve([digest]);
    } else {
      let digests = [];
      _.forEach(sighashes, function(sighash) {
        digests.push(this.getDigest(index, prev_script, sighash));
      });
      solveData = solver.solve(digests);
    }
    const scriptSig = solveData.scriptSig;
    const witness = solveData.witness;
    this.inputs[index].scriptSig = scriptSig;
  }
  spendClassic(txouts, solvers) {
    if (_.some(solvers, solver => solver.solvesSegwit()))
      return this.spendSegwit(txouts, solvers);
    if (solvers.length != this.inputs.length || txouts.length != solvers.length)
      throw new Error("The number of solvers must be equal to the number of utxos");
    _.forEach(_.zip(_.range(solvers.length), txouts, solvers), list =>
      this.spendSingle(list[0], list[1], list[2])
    );
    return this.toImmutable();
  }
  spendSegwitSingle(index, txout, solver) {
    const sighashes = solver.getSighashes();
    const prev_script = solver.hasPrevScript() ? solver.getPrevScript() : txout.scriptPubKey;
    let solveData;
    if (sighashes.length == 0) {
      solveData = solver.solve();
    } else if (sighashes.length == 1) {
      if (solver.solvesSegwit()) {
        let digest = this.getSegwitDigest(index, prev_script, txout.amount, sighashes[0]);
        solveData = solver.solve(digest);
      } else {
        let digest = this.getDigest(index, prev_script, sighashes[0]);
        solveData = solver.solve(digest);
      }
    } else {
      let digests = [];
      if (solver.solvesSegwit()) {
        _.forEach(sighashes, sighash => {
          digests.push(this.getSegwitDigest(index, prev_script, txout.amount, sighash));
        });
      } else {
        _.forEach(sighashes, sighash => {
          digests.push(this.getDigest(index, prev_script, sighash));
        });
      }
      solveData = solver.solve(digests);
    }

    this.inputs[index].scriptSig = solveData.scriptSig;
    this.inputs[index].witness = solveData.witness;
  }
  spendSegwit(txouts, solvers) {
    if (solvers.length != this.inputs.length || txouts.length != solvers.length)
      throw new Error("The number of solvers must be equal to the number of utxos");
    _.forEach(_.zip(_.range(solvers.length), txouts, solvers), list =>
      this.spendSegwitSingle(list[0], list[1], list[2])
    );
    return this.toImmutable();
  }
}
class Sighash {
  constructor(sighash, anyonecanpay = false) {
    if (!(sighash in Sighash.types)) {
      throw new TypeError("Invalid sighash provided");
    }
    this.sighash = sighash;
    this.anyonecanpay = anyonecanpay;
    if (new.target === Sighash) {
      Object.freeze(this);
    }
  }
  toInt() {
    if (this.anyonecanpay) return Sighash.types[this.sighash] | 0x80;
    return Sighash.types[this.sighash];
  }
  static fromByte(byte) {
    if (byte & 0x80) {
      return new Sighash(Sighash.bytes[byte & ~0x80], true);
    }
    return new Sighash(Sighash.bytes[byte], false);
  }
  toByte() {
    return $.numToBytes(this.toInt(), 1);
  }
  serialize() {
    return $.numToBytes(this.toInt(), 4);
  }
}
Sighash.types = {
  ALL: 0x01,
  NONE: 0x02,
  SINGLE: 0x03
};
Sighash.bytes = {
  1: "ALL",
  2: "NONE",
  3: "SINGLE"
};
class Output {
  constructor(amount, scriptPubKey) {
    this.amount = amount;
    this.scriptPubKey = scriptPubKey;
  }
  toJSON() {
    return JSON.stringify({
      amount: this.amount.toString(10),
      script: this.scriptPubKey.body.toString("hex")
    });
  }
  serialize() {
    let dim =
      8 +
      $.numToVarInt(this.scriptPubKey.body.capacity()).length +
      $.numToVarInt(this.scriptPubKey.body.capacity())[0];
    let buffer = new ByteBuffer(dim);
    let ser_spk = this.scriptPubKey.serialize();
    buffer.append($.numToBytes(this.amount, 8));
    buffer.append($.numToVarInt(this.scriptPubKey.body.capacity()));
    buffer.append(ser_spk.toHex(0, ser_spk.capacity()), "hex");
    return buffer;
  }
}
class Input {
  constructor(txid, out, scriptSig, sequence, witness = undefined) {
    this.txid = txid;
    this.out = out;
    this.scriptSig = scriptSig;
    this.sequence = sequence;
    this.witness = witness;
  }
  toJSON() {
    return JSON.stringify({
      txid: this.txid,
      out: this.out,
      scriptSig: this.scriptSig.body.toHex(0, this.scriptSig.body.capacity()),
      sequence: this.sequence.n
    });
  }
  serialize() {
    let dim =
      $.hexToBytes(this.txid).reverse().length +
      $.numToVarInt(this.scriptSig.body.capacity()).length +
      $.numToVarInt(this.scriptSig.body.capacity())[0] +
      8;

    const buffer = new ByteBuffer(dim);
    const ser_sig = this.scriptSig.serialize();
    buffer.append($.hexToBytes(this.txid).reverse());
    buffer.append($.numToBytes(this.out, 4));
    buffer.append($.numToVarInt(this.scriptSig.body.capacity()));
    buffer.append(ser_sig.toHex(0, ser_sig.capacity()), "hex");
    buffer.append($.numToBytes(this.sequence.n, 4));
    return buffer;
  }
}
class Witness {
  constructor(data) {
    this.data = data;
  }
  serialize() {
    let dim = 0;
    _.forEach(this.data, data => {
      dim += data.capacity() + $.numToVarInt(data.capacity()).length;
    });
    const buffer = new ByteBuffer(dim);
    _.forEach(this.data, data => {
      buffer.append($.numToVarInt(data.capacity()));
      buffer.append(data.toHex(0, data.capacity()), "hex");
    });
    buffer.prepend($.numToVarInt(this.data.length), 0);
    return buffer;
  }
  toScriptSig() {
    let scriptSigdata = [];
    _.forEach(this.data, data => {
      let pushop = scripts.StackData.getPushOp($.hexToBytes(data.toHex(0, data.capacity())));
      scriptSigdata.push(pushop);
    });
    scriptSigdata = _.flatten(scriptSigdata);
    return new scripts.ScriptSig(
      new ByteBuffer(scriptSigdata.length).append(scriptSigdata, 0)
    );
  }
  toHex() {
    let hex = "";
    _.forEach(this.data, data => {
      hex += data.toHex(0, data.capacity());
    });
    return hex;
  }
}
class Sequence {
  constructor(n) {
    this.n = n;
  }
  isTime() {
    return Boolean(this.n & ((1 << Sequence.disableFlag) >>> 0));
  }
  isBlocks() {
    return !this.isTime();
  }
  isActive() {
    return !(this.n & ((1 << Sequence.typeFlag) >>> 0));
  }
}
Sequence.disableFlag = 31;
Sequence.typeFlag = 22;
Sequence.max = 0xffffffff;

class Locktime {
  constructor(n) {
    this.n = n;
  }
  isBlocks() {
    return 0 < this.n && this.n < Locktime.threshold;
  }
  isTime() {
    return this.n >= Locktime.threshold;
  }
  isActive() {
    return this.n > 0;
  }
}

Locktime.threshold = 500000000;

module.exports = {
  Transaction,
  MutableTransaction,
  Locktime,
  Input,
  Witness,
  Sequence,
  Output,
  Sighash
};
const bitcoin = require("bitcoinjs-lib");
const $ = require("../tools/conversions");
const scripts = require("./scripts");
const ByteBuffer = require("bytebuffer");
const bufferUtils = require("../tools/bytebuffer");
const shajs = require("sha.js");
const _ = require("lodash");
