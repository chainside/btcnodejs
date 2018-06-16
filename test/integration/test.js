"use strict";
const _ = require("lodash");
const assert = require("assert");
const before = require("mocha").before;
const beforeEach = require("mocha").beforeEach;
const after = require("mocha").after;
const afterEach = require("mocha").afterEach;
const net = require("../../lib/network");
const hd = require("../../lib/hd");
const rpcclient = require("./client");
const scripts = require("../../lib/scripts");
const transactions = require("../../lib/transaction");
const solvers = require("../../lib/solvers");
const Address = require("../../lib/address").Address;

const Sighash = transactions.Sighash;
const Locktime = transactions.Locktime;
const Output = transactions.Output;
const Input = transactions.Input;
const Transaction = transactions.Transaction;
const MutableTransaction = transactions.MutableTransaction;
const Sequence = transactions.Sequence;

const P2pkhSolver = solvers.P2pkhSolver;
const MultiSigSolver = solvers.MultiSigSolver;
const IfElseSolver = solvers.IfElseSolver;
const RtlSolver = solvers.RelativeTimelockSolver;
const P2shSolver = solvers.P2shSolver;
const P2wpkhV0Solver = solvers.P2wpkhV0Solver;
const P2wshV0Solver = solvers.P2wshV0Solver;
net.setup("testnet");

var receivingKeys = [
    new hd.HDPrivateKey("tprv8koNFULfCFjfqeDg9QTcfyxkBisnvPQnnmRqPDrPp1LvdBggx6xDSyA94cjpAXS7ccGhsQ7w6q7Y9Ku31e1eTDztU49LVBz9B1sCDoeE6Jc"),
    new hd.HDPrivateKey("tprv8i1brHVfbRSRNdMjy9iiztn5jgcuSJE2GrjvArfwYbTvpm2mG6ms3fGvA5kdZ3qZ7KB26VehAudSCUURKT56Hej2pBgj26ZkNbdD1YMdTiD"),
    new hd.HDPrivateKey("tprv8h9LQLag5wujQrrqgS78W6Y4wp162HwvjD5f65qRRPdtbW84FLzw6fjrCNeqEvsKqiDxLtzJ9oHUGVTL17KptjbDVqgJ2XvAs2LcvSWrTUh"),
    new hd.HDPrivateKey("tprv8dm8XhEGtsc5tpQS71peHY91tz4JM4BjBNpxaYaspkFg7fhRUVcFJFjGPFHYGQLo21nmCrkjryoUFJKSKMUjKqpuRXAmMMhvMaP27UtqeLA")];
var receivingAddresses = _.map(receivingKeys, key => key.privkey.getPublic().toAddress().toBase58());

var initUtxo = [];
var initSolvers = _.map(receivingKeys, key => new P2pkhSolver(key.privkey));

var sighashes = [
    new Sighash("ALL", false),
    new Sighash("ALL", true),
    new Sighash("NONE", false),
    new Sighash("NONE", true),
    new Sighash("SINGLE", false),
    new Sighash("SINGLE", true)];

const SATOSHIS = function (val) {
    const satoshis = val * 100000000;
    return satoshis;
};
const masterKey = new hd.HDPrivateKey("tprv8koNFULfCFjfqeDg9QTcfyxkBisnvPQnnmRqPDrPp1LvdBggx6xD" +
    "SyA94cjpAXS7ccGhsQ7w6q7Y9Ku31e1eTDztU49LVBz9B1sCDoeE6Jc");

const formatOutputs = function (tx) {
    var formatted = [];
    _.forEach(tx.outputs, (output, index) => {
        formatted.push({
            n: index,
            out: output,
            txid: tx.txid
        });
    });
    return formatted;
};
const formatInitOutputs = function (tx) {
    var formatted = [];
    _.forEach(tx.outputs, (output, index) => {
        var out_address = new Address("p2pkh", output.scriptPubKey.pubkeyhash, "testnet");
        if (receivingAddresses.includes(out_address.toBase58())) {
            formatted.push({
                n: index,
                out: output,
                txid: tx.txid
            });
        }
    });
    return formatted;
};
const checkSegwit = function (solvers) {
    var segwit = false;
    if (_.some(solvers, solver => solver.solvesSegwit())) {
        segwit = true;
    }
    return segwit;
};
const spendToP2pkh = function (outputs, solvers, amount) {
    return new Promise((resolve, reject) => {
        if (solvers.length !== outputs.length) throw "A solver for each output must be provided";
        var txouts = [];
        var txins = [];

        var segwit = checkSegwit(solvers);
        _.forEach(outputs, out => {
            var script = new scripts.P2pkhScript(masterKey.privkey.getPublic());

            txouts.push(new Output(amount, script));
            txins.push(new Input(out.txid, out.n, scripts.ScriptSig.empty(), new Sequence(0)));
        });

        var tx = new MutableTransaction(2, txins, txouts, new Locktime(0), segwit);
        var spent = tx.spend(_.map(outputs, output => output.out), solvers);

        rpcclient.sendRawTransaction(spent.toHex())
            .then(() => resolve([formatOutputs(spent), _.map(spent.outputs, out => new P2pkhSolver(masterKey.privkey))]))
            .catch(err => reject(err));

    });
};

const spendToMultisig = function (outputs, solvers, amount) {
    return new Promise((resolve, reject) => {
        if (solvers.length !== outputs.length) throw "A solver for each output must be provided";

        var txouts = [];
        var txins = [];
        var segwit = checkSegwit(solvers);

        let [privkey1, privkey2, privkey3] = [receivingKeys[0].privkey, receivingKeys[1].privkey, receivingKeys[2].privkey];
        _.forEach(outputs, (out, index) => {
            var script = new scripts.MultiSigScript([
                2,
                privkey1.getPublic(),
                privkey2.getPublic(),
                privkey3.getPublic(),
                3]);
            txouts.push(new Output(amount, script));
            txins.push(new Input(out.txid, out.n, scripts.ScriptSig.empty(), new Sequence(0)));
        });

        var tx = new MutableTransaction(2, txins, txouts, new Locktime(0), segwit);
        var spent = tx.spend(_.map(outputs, output => output.out), solvers);

        rpcclient.sendRawTransaction(spent.toHex())
            .then(() => resolve([formatOutputs(spent), _.map(spent.outputs, out => new MultiSigSolver([privkey1, privkey2]))]))
            .catch(err => reject(err));
    });
};

const spendToIfElse = function (outputs, solvers, amount, branch) {
    return new Promise((resolve, reject) => {
        if (solvers.length !== outputs.length) throw "A solver for each output must be provided";
        if (outputs.length !== 2) throw "Invalid data length to build if-else outputs";
        var txouts = [];
        var txins = [];
        var segwit = checkSegwit(solvers);
        var if_branch = outputs[0].out.scriptPubKey;
        var else_branch = outputs[1].out.scriptPubKey;
        var script = new scripts.IfElseScript([if_branch, else_branch]);
        _.forEach(outputs, out => {
            txins.push(new Input(out.txid, out.n, scripts.ScriptSig.empty(), new Sequence(0)));
        });
        txouts.push(new Output(amount, script));
        var tx = new MutableTransaction(2, txins, txouts, new Locktime(0), segwit);
        var spent = tx.spend(_.map(outputs, output => output.out), solvers);

        var solver = branch === 0 ? solvers[1] : solvers[0];
        rpcclient.sendRawTransaction(spent.toHex())
            .then(() => resolve([formatOutputs(spent), _.map(spent.outputs, out => new IfElseSolver(branch, solver))]))
            .catch(err => reject(err));
    });
};

const spendToRtl = function (outputs, solvers, amount, sequence) {
    return new Promise((resolve, reject) => {
        if (solvers.length !== outputs.length) throw "A solver for each output must be provided";
        var txouts = [];
        var txins = [];
        var segwit = checkSegwit(solvers);
        _.forEach(outputs, out => {
            var script = new scripts.RelativeTimelockScript([out.out.scriptPubKey, sequence]);
            txouts.push(new Output(amount, script));
            txins.push(new Input(out.txid, out.n, scripts.ScriptSig.empty(), new Sequence(0)));
        });
        var tx = new MutableTransaction(2, txins, txouts, new Locktime(0), segwit);
        var spent = tx.spend(_.map(outputs, output => output.out), solvers);
        rpcclient.sendRawTransaction(spent.toHex())
            .then(() => resolve([formatOutputs(spent), _.map(spent.outputs, (out, index) =>
                new RtlSolver(solvers[index]))]))
            .catch(err => reject(err));
    });
};
const spendToP2sh = function (outputs, solvers, amount) {
    return new Promise((resolve, reject) => {
        if (solvers.length !== outputs.length) throw "A solver for each output must be provided";
        var txouts = [];
        var txins = [];
        var segwit = checkSegwit(solvers);

        _.forEach(outputs, out => {
            var script = new scripts.P2shScript(out.out.scriptPubKey);
            txouts.push(new Output(amount, script));
            txins.push(new Input(out.txid, out.n, scripts.ScriptSig.empty(), new Sequence(0)));
        });

        var tx = new MutableTransaction(2, txins, txouts, new Locktime(0), segwit);

        var spent = tx.spend(_.map(outputs, output => output.out), solvers);
        rpcclient.sendRawTransaction(spent.toHex())
            .then(() => resolve([formatOutputs(spent), _.map(outputs, (out, index) =>
                new P2shSolver(out.out.scriptPubKey, solvers[index]))]))
            .catch(err => reject(err));
    });
};
const spendToP2wpkhV0 = function (outputs, solvers, amount) {
    return new Promise((resolve, reject) => {
        if (solvers.length !== outputs.length) throw "A solver for each output must be provided";
        var txouts = [];
        var txins = [];
        var segwit = checkSegwit(solvers);
        _.forEach(outputs, out => {
            var script = new scripts.P2wpkhV0Script(masterKey.privkey.getPublic());
            txouts.push(new Output(amount, script));
            txins.push(new Input(out.txid, out.n, scripts.ScriptSig.empty(), new Sequence(0)));
        });
        var tx = new MutableTransaction(2, txins, txouts, new Locktime(0), segwit);
        var spent = tx.spend(_.map(outputs, output => output.out), solvers);
        rpcclient.sendRawTransaction(spent.toHex())
            .then(() => resolve([formatOutputs(spent), _.map(spent.outputs, (out, index) =>
                new P2wpkhV0Solver(masterKey.privkey))]))
            .catch(err => reject(err));
    });
};
const spendToP2wshV0 = function (outputs, solvers, amount) {
    return new Promise((resolve, reject) => {
        if (solvers.length !== outputs.length) throw "A solver for each output must be provided";
        var txouts = [];
        var txins = [];
        var segwit = checkSegwit(solvers);
        _.forEach(outputs, out => {
            var script = new scripts.P2wshV0Script(out.out.scriptPubKey);
            txouts.push(new Output(amount, script));
            txins.push(new Input(out.txid, out.n, scripts.ScriptSig.empty(), new Sequence(0)));
        });
        var tx = new MutableTransaction(2, txins, txouts, new Locktime(0), segwit);
        var spent = tx.spend(_.map(outputs, output => output.out), solvers);
        rpcclient.sendRawTransaction(spent.toHex())
            .then(() => resolve([formatOutputs(spent), _.map(outputs, (out, index) =>
                new P2wshV0Solver(out.out.scriptPubKey, solvers[index]))]))
            .catch(err => reject(err));
    });
};
// generate initial regtest coins
const fundAddresses = function () {
    return new Promise(async (resolve, reject) => {
        rpcclient.generateBlocks(200).then(async () => {
            for (var addr of receivingAddresses) {
                await rpcclient.sendToAddress(addr, 10.0).then(txid => {
                    rpcclient.getRawTransaction(txid).then(tx_raw => {
                        var tx = Transaction.fromHex(tx_raw);
                        initUtxo.push(formatInitOutputs(tx));
                        if (initUtxo.length === receivingAddresses.length) resolve();
                    }).catch(err => reject(err));
                }).catch(err => reject(err));
            }
        }).catch(err => reject(err));
    });
};

const setup = function () {
    beforeEach((done) => {
        rpcclient.runNodes()
            .then(() => fundAddresses())
            .then(() => done())
            .catch(err => done(err));
    });
    afterEach((done) => {
        rpcclient.stopNodes()
            .then(rpcclient.clearNodes())
            .then(() => {
                initUtxo = [];
                done();
            })
            .catch(err => done(err));
    });
};

describe("Integration Test", function () {
    this.timeout(10000);
    setup();
    it("can generate starting utxo", () => {
        assert.equal(initUtxo.length, receivingAddresses.length);
    });
});
describe("btcnodejs If-Else signature algorithm", function () {
    this.timeout(10000);
    setup();
    it("can spend if {multisig} else {p2pkh} and if {p2pkk} else {multisig} outputs", (done) => {

        spendToMultisig(_.flatten(initUtxo).slice(0, 2), initSolvers.slice(0, 2), SATOSHIS(9))
            .then(([multisig_outs, multisig_solvers]) => {
                spendToP2pkh(_.flatten(initUtxo).slice(2, 4), initSolvers.slice(2, 4), SATOSHIS(9))
                    .then(([p2pkh_outs, p2pkh_solvers]) => {
                        spendToIfElse([p2pkh_outs[0], multisig_outs[1]], [p2pkh_solvers[0], multisig_solvers[1]], SATOSHIS(8), 0)
                            .then(([if_else_out, if_else_solver]) => {
                                spendToIfElse([p2pkh_outs[1], multisig_outs[0]], [p2pkh_solvers[1], multisig_solvers[0]], SATOSHIS(7), 1)
                                    .then(([if_else_out2, if_else_solver2]) => {
                                        spendToP2pkh(_.flatten([if_else_out, if_else_out2]), _.flatten([if_else_solver, if_else_solver2]), SATOSHIS(7))
                                            .then(([outs, solvers]) => assert(outs.length === solvers.length))
                                            .then(() => done())
                                            .catch(err => done(err));
                                    });
                            });
                    });
            });
    });
});
describe("btcnodejs P2pkh signature algorithm", function () {
    this.timeout(10000);
    setup();
    it("can spend p2pkh transactions", (done) => {
        spendToP2pkh(_.flatten(initUtxo), initSolvers, SATOSHIS(9))
            .then(([outs, solvers]) => spendToP2pkh(outs, solvers))
            .then(([outs, solvers]) => assert.equal(outs.length, solvers.length))
            .then(() => done())
            .catch(err => done(err));
    });
});

describe("btcnodejs Multisig signature algorithm", function () {
    this.timeout(10000);
    setup();
    it("can spend multisig transactions", (done) => {
        spendToMultisig(_.flatten(initUtxo), initSolvers, SATOSHIS(9))
            .then(([outs, solvers]) => spendToP2pkh(outs, solvers, SATOSHIS(8)))
            .then(([outs, solvers]) => assert.equal(outs.length, solvers.length))
            .then(() => done())
            .catch(err => done(err));
    });
});

describe("btcnodejs Rtl signature algorithm", function () {
    this.timeout(10000);
    setup();
    it("can spend rtl transactions", (done) => {
        spendToRtl(_.flatten(initUtxo), initSolvers, SATOSHIS(9), new Sequence(0))
            .then(([outs, solvers]) => spendToP2pkh(outs, solvers, SATOSHIS(8)))
            .then(([outs, solvers]) => assert.equal(outs.length, solvers.length))
            .then(() => done())
            .catch(err => done(err));
    });
});


describe("btcnodejs P2sh signature algorithm", function () {
    this.timeout(10000);
    setup();

    it("can spend p2sh over p2pkh transactions", (done) => {
        spendToP2sh(_.flatten(initUtxo), initSolvers, SATOSHIS(9))
            .then(([outs, solvers]) => spendToP2pkh(outs, solvers, SATOSHIS(8)))
            .then(([outs, solvers]) => assert.equal(outs.length, solvers.length))
            .then(() => done())
            .catch(err => done(err));
    });
    it("can spend p2sh over if-else transactions", (done) => {
        spendToIfElse(_.flatten(initUtxo).slice(0, 2), initSolvers.slice(0, 2), SATOSHIS(9), 0)
            .then(([if_else_out, if_else_solver]) => spendToP2sh(if_else_out, if_else_solver, SATOSHIS(8)))
            .then(([outs, solvers]) => spendToP2pkh(outs, solvers, SATOSHIS(7)))
            .then(([outs, solvers]) => assert.equal(outs.length, solvers.length))
            .then(() => done())
            .catch(err => done(err));
    });
    it("can spend p2sh over rtl transactions", (done) => {
        spendToRtl(_.flatten(initUtxo), initSolvers, SATOSHIS(9), new Sequence(0))
            .then(([outs, solvers]) => spendToP2sh(outs, solvers, SATOSHIS(8)))
            .then(([outs, solvers]) => spendToP2pkh(outs, solvers, SATOSHIS(7)))
            .then(([outs, solvers]) => assert.equal(outs.length, solvers.length))
            .then(() => done())
            .catch(err => done(err));
    });

    it("can spend p2sh over multisig transactions", (done) => {
        spendToMultisig(_.flatten(initUtxo), initSolvers, SATOSHIS(9))
            .then(([outs, solvers]) => spendToP2sh(outs, solvers, SATOSHIS(8)))
            .then(([outs, solvers]) => spendToP2pkh(outs, solvers, SATOSHIS(7)))
            .then(([outs, solvers]) => assert.equal(outs.length, solvers.length))
            .then(() => done())
            .catch(err => done(err));
    });

    it("can spend p2sh over p2wpkh transactions", (done) => {
        spendToP2wpkhV0(_.flatten(initUtxo), initSolvers, SATOSHIS(9))
            .then(([outs, solvers]) => spendToP2sh(outs, solvers, SATOSHIS(8)))
            .then(([outs, solvers]) => spendToP2pkh(outs, solvers, SATOSHIS(7)))
            .then(([outs, solvers]) => assert.equal(outs.length, solvers.length))
            .then(() => done())
            .catch(err => done(err));
    });

});


describe("btcnodejs P2wpkhV0 signature algorithm", function () {
    this.timeout(10000);
    setup();
    it("can spend p2wpkh over p2pkh transactions", (done) => {
        spendToP2wpkhV0(_.flatten(initUtxo), initSolvers, SATOSHIS(9))
            .then(([outs, solvers]) => spendToP2pkh(outs, solvers, SATOSHIS(8)))
            .then(([outs, solvers]) => assert.equal(outs.length, solvers.length))
            .then(() => done())
            .catch(err => done(err));
    });
});
describe("btcnodejs P2wshV0 signature algorithm", function () {
    this.timeout(10000);
    setup();
    it("can spend p2wshv0 over p2pkh transactions", (done) => {
        spendToP2wshV0(_.flatten(initUtxo), initSolvers, SATOSHIS(9))
            .then(([outs, solvers]) => spendToP2pkh(outs, solvers, SATOSHIS(8)))
            .then(([outs, solvers]) => assert.equal(outs.length, solvers.length))
            .then(() => done())
            .catch(err => done(err));
    });
    it("can spend p2wshv0 over ");
});
module.exports = {};

/*
var script = new scripts.P2pkhScript(receiving_keys[0].privkey.getPublic());
        var txout = new Output(1, script);
        var txin = new Input(init_utxo[0].txid, 0, scripts.ScriptSig.empty(), new transactions.Sequence(0));
        var tx = new MutableTransaction(2, [txin], [txout], new Locktime(0));

        var spent = tx.spendClassic([tx.outputs[0]], [new solvers.P2pkhSolver(receiving_keys[0].privkey)]);
        rpcclient.sendRawTransaction(spent.toHex())
            .then(txid => assert.equal(txid, spent.txid))
            .then(() => done())
            .catch(err => console.log(err));

 spendToIfElse(
                                [p2pkh_outs[1], multisig_outs[1]],
                                [p2pkh_solvers[1], multisig_solvers[1]], SATOSHIS(8), 1).then(([if_else_out2, if_else_solver2]) => {
 */
