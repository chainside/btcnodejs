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
class Solver {
  constructor(sighashes = new transaction.Sighash("ALL")) {
    this.sighashes = sighashes;
  }
  hasPrevScript() {
    return false;
  }
}
class SingleSigSolver extends Solver {
  constructor(sighash = new transaction.Sighash("ALL")) {
    super(sighash);
    this.sighash = sighash;
  }
  getSighashes() {
    return [this.sighash];
  }
  solvesSegwit() {
    return false;
  }
}
class SegwitSolver extends Solver {
  solvesSegwit() {
    return true;
  }
}
class P2pkhSolver extends SingleSigSolver {
  constructor(privkey, sighash = new transaction.Sighash("ALL")) {
    super(sighash);
    this.privkey = privkey;
  }
  solve(digests) {
    const pubkey = this.privkey.getPublic();

    const signature = _.concat(
      $.hexToBytes(this.privkey.signDER(digests[0])),
      this.sighash.toByte()
    );

    const pkpushop = scripts.StackData.getPushOp($.hexToBytes(pubkey.toHex()));
    const sigpushop = scripts.StackData.getPushOp(signature);
    const scriptSigbody = new ByteBuffer.fromHex($.bytesToHex(_.concat(sigpushop, pkpushop)));
    return {
      scriptSig: new scripts.ScriptSig(scriptSigbody),
      witness: new transaction.Witness([])
    };
  }
}
class P2wpkhV0Solver extends P2pkhSolver {
  constructor(privkey, sighash = new transaction.Sighash("ALL")) {
    super(privkey, sighash);
  }
  solve(digest) {
    const solveData = super.solve(digest);
    const scriptSig = solveData.scriptSig;
    const witness = solveData.witness;
    return {
      scriptSig: witness.toScriptSig(),
      witness: scriptSig.toWitness()
    };
  }
  solvesSegwit() {
    return true;
  }
}
class P2shSolver {
  constructor(redeemScript, redeemScriptSolver) {
    this.redeemScript = redeemScript;
    this.redeemScriptSolver = redeemScriptSolver;
  }
  solve(digests) {
    const solveData = this.redeemScriptSolver.solve(digests);
    const redeemSig = solveData.scriptSig;
    const redeemWitness = solveData.witness;
    const redeempushop = scripts.StackData.getPushOp($.hexToBytes(this.redeemScript.toHex()));
    const redeemSigpushop = $.hexToBytes(redeemSig.toHex());
    const scriptSigbody = new ByteBuffer.fromHex(
      $.bytesToHex(_.concat(redeemSigpushop, redeempushop))
    );
    return {
      scriptSig: new scripts.ScriptSig(scriptSigbody),
      witness: redeemWitness
    };
  }
  getSighashes() {
    return this.redeemScriptSolver.getSighashes();
  }
  solvesSegwit() {
    return this.redeemScriptSolver.solvesSegwit();
  }
  getPrevScript() {
    if (this.redeemScriptSolver.hasPrevScript())
      return this.redeemScriptSolver.getPrevScript();
    return this.redeemScript;
  }
  hasPrevScript() {
    return true;
  }
}
class P2wshV0Solver extends SegwitSolver {
  constructor(witnessScript, witnessScriptSolver) {
    super();
    this.witnessScript = witnessScript;
    this.witnessScriptSolver = witnessScriptSolver;
  }
  solve(digests) {
    const solveData = this.witnessScriptSolver.solve(digests);
    const witnessSig = solveData.scriptSig;
    const witnessWit = solveData.witness;
    return {
      scriptSig: new scripts.ScriptSig(new ByteBuffer(0)),
      witness: new transaction.Witness(
        _.concat(witnessSig.toWitness().data, witnessWit.data, this.getPrevScript().body)
      )
    };
  }
  getPrevScript() {
    return this.witnessScript;
  }
  getSighashes() {
    return this.witnessScriptSolver.getSighashes();
  }
  hasPrevScript() {
    return true;
  }
}
class MultiSigSolver extends Solver {
  constructor(privkeys, sighashes = null) {
    let selfSighashes = [];
    if (!sighashes)
      _.forEach(privkeys, () => selfSighashes.push(new transaction.Sighash("ALL")));
    else selfSighashes = sighashes;
    super(selfSighashes);
    this.sighashes = selfSighashes;
    this.privkeys = privkeys;
  }
  solve(digests) {
    if (digests.length != this.privkeys.length)
      throw new RangeError(
        "The number of digests must be equal to the number of private keys"
      );
    let signatures = [];
    let privkeys = this.privkeys;
    let sighashes = this.sighashes;

    _.forEach(digests, function(digest, index) {
      signatures.push(
        scripts.StackData.getPushOp(
          _.concat($.hexToBytes(privkeys[index].signDER(digest)), sighashes[index].toByte())
        )
      );
    });

    const scriptSigbody = new ByteBuffer.fromHex(
      $.bytesToHex(_.concat($.numToBytes(0, 1), _.flatten(signatures)))
    );

    return {
      scriptSig: new scripts.ScriptSig(scriptSigbody),
      witness: new transaction.Witness([])
    };
  }
  getSighashes() {
    return this.sighashes;
  }
  solvesSegwit() {
    return false;
  }
}
class IfElseSolver {
  constructor(branch, innerSolver) {
    this.branch = branch;
    this.innerSolver = innerSolver;
  }
  solve(digests) {
    const solveData = this.innerSolver.solve(digests);
    const innerSig = solveData.scriptSig;
    const innerWit = solveData.witness;
    const innerSigpushop = $.hexToBytes(innerSig.toHex());
    const branchPushop = scripts.StackData.opFromInt(this.branch);
    const scriptSigbody = new ByteBuffer.fromHex(
      $.bytesToHex(_.concat(innerSigpushop, branchPushop))
    );
    return {
      scriptSig: new scripts.ScriptSig(scriptSigbody),
      witness: innerWit
    };
  }
  getSighashes() {
    return this.innerSolver.getSighashes();
  }
  solvesSegwit() {
    return this.innerSolver.solvesSegwit();
  }
}
class RelativeTimelockSolver extends Solver {
  constructor(innerSolver) {
    super();
    this.innerSolver = innerSolver;
  }
  solve(digests) {
    return this.innerSolver.solve(digests);
  }
  getSighashes() {
    return this.innerSolver.getSighashes();
  }
  solvesSegwit() {
    return this.innerSolver.solvesSegwit();
  }
}

module.exports = {
  SingleSigSolver,
  P2pkhSolver,
  P2shSolver,
  MultiSigSolver,
  IfElseSolver,
  RelativeTimelockSolver,
  P2wpkhV0Solver,
  P2wshV0Solver
};
const $ = require("../tools/conversions");
const _ = require("lodash");
const scripts = require("./scripts");
const ByteBuffer = require("bytebuffer");
const transaction = require("./transaction");
