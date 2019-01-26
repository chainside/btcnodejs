"use strict";
const net = require("../lib/network");
const assert = require("assert");
const transaction = require("../lib/transaction");
const scripts = require("../lib/scripts");
const crypto = require("../lib/crypto");
const address = require("../lib/address");
const bip39 = require("../lib/bip39");
const ByteBuffer = require("bytebuffer");
const BlockHeader = require("../lib/block").BlockHeader;
const hd = require("../lib/hd");
const solvers = require("../lib/solvers");
const $ = require("../tools/conversions");
const fs = require("fs");
const _ = require("lodash");
net.setup("testnet", true);

const blocks = require("./blocks");
const transactions = require("./transactions");

const scriptsigs = require("./scripts").sigs;
const test_scripts = require("./scripts").spk;
const bip32keys = require("./bip32").keys;
const wifkeys = require("./wif").keys;
const signatures = require("./signatures").signatures;
const segwitaddresses = require("./segwit").addresses;
const segwit_data = require("./segwit").txs_data;
const hd_keys = require("./hd").keys;
const digests = require("./signatures").digests;
const addresses = require("./addresses").t_addresses;
const sigs_vectors = [];

const bip39_seeds = require("./bip39").seeds;
var getBranchesTypes = function (type) {
    const reg = new RegExp("if{ (.+) }else{ (.+) }");
    const res = reg.exec(type);
    return {
        if_b: res[1],
        else_b: res[2]
    };
};
var getTimelockedType = function (type) {
    const reg = new RegExp("\\[relativetimelock\\] (.+)");
    const res = reg.exec(type);
    return {
        tl_type: res[1]
    };
};
describe("Solvers", function () {

    fs
        .readFileSync("./test/solversdata")
        .toString()
        .split("\n")
        .slice(0, -1)
        .forEach(function (line) {
            if (!(line.includes("[timelock]") || line.includes("[hashlock]")))
                sigs_vectors.push(JSON.parse(line));
        });
    describe("P2pkSolver", function () {
        it("can compute the correct scriptSig", function () {
            _.forEach(sigs_vectors, vector => {
                if (vector["script_pubkey"]["type"] === "p2pk") {
                    let solver = new solvers.P2pkSolver(
                        crypto.Privatekey.fromHex(vector["spend_data"]["priv_keys"][0]),
                        transaction.Sighash.fromByte($.hexToBytes(vector["spend_data"]["sig_hashes"][0]))
                    );
                    let signature = solver.solve(vector["digests"]);
                    assert.equal(signature.scriptSig.toHex(), vector["script_sig"]);
                }
            });
        });
    });
    describe("P2PkhSolver", function () {
        it("can compute the correct scriptSig", function () {
            _.forEach(sigs_vectors, vector => {
                if (vector["script_pubkey"]["type"] === "p2pkh") {
                    let solver = new solvers.P2pkhSolver(
                        crypto.Privatekey.fromHex(vector["spend_data"]["priv_keys"][0]),
                        transaction.Sighash.fromByte($.hexToBytes(vector["spend_data"]["sig_hashes"][0]))
                    );
                    let signature = solver.solve(vector["digests"]);
                    assert.equal(signature.scriptSig.toHex(), vector["script_sig"]);
                }
            });
        });
    });
    describe("P2wpkhV0Solver", function () {
        it("can compute the correct scriptSig", function () {
            _.forEach(sigs_vectors, vector => {
                if (vector["script_pubkey"]["type"] === "p2wpkhv0") {
                    let solver = new solvers.P2wpkhV0Solver(
                        crypto.Privatekey.fromHex(vector["spend_data"]["priv_keys"][0]),
                        transaction.Sighash.fromByte($.hexToBytes(vector["spend_data"]["sig_hashes"][0]))
                    );
                    let signature = solver.solve(vector["digests"]);
                    let ser_wit = signature.witness.serialize();
                    assert.equal(ser_wit.toHex(0, ser_wit.capacity()), vector["witness"]);
                    assert.equal(signature.scriptSig.toHex(), vector["script_sig"]);
                }
            });
        });
    });
    describe("MultiSigSolver", function () {
        it("can compute the correct scriptSig", function () {
            _.forEach(sigs_vectors, vector => {
                if (vector["script_pubkey"]["type"] === "multisig") {
                    const privkeys = _.map(vector["spend_data"]["priv_keys"], hexkey => {
                        return crypto.Privatekey.fromHex(hexkey);
                    });

                    const sighashes = _.map(vector["spend_data"]["sig_hashes"], sighash => {
                        return transaction.Sighash.fromByte($.hexToBytes(sighash));
                    });
                    let solver = new solvers.MultiSigSolver(privkeys, sighashes);
                    let signature = solver.solve(vector["digests"]);
                    assert.equal(signature.scriptSig.toHex(), vector["script_sig"]);
                }
            });
        });
    });
    describe("P2shSolver", function () {
        it("can compute the correct scriptSig", function () {
            _.forEach(sigs_vectors, vector => {
                if (vector["script_pubkey"]["type"] === "p2sh") {
                    let redeem_solver;
                    const redeem_script = scripts.ScriptPubKey.fromHex(
                        vector["spend_data"]["redeem_script"]["hex"]
                    );
                    if (vector["spend_data"]["redeem_script"]["type"] === "p2pkh") {
                        redeem_solver = new solvers.P2pkhSolver(
                            crypto.Privatekey.fromHex(vector["spend_data"]["priv_keys"][0]),
                            transaction.Sighash.fromByte($.hexToBytes(vector["spend_data"]["sig_hashes"][0]))
                        );

                        let solver = new solvers.P2shSolver(redeem_script, redeem_solver);
                        let signature = solver.solve(vector["digests"]);
                        assert.equal(signature.scriptSig.toHex(), vector["script_sig"]);
                    } else if (vector["spend_data"]["redeem_script"]["type"] === "p2pk") {
                        redeem_solver = new solvers.P2pkSolver(
                            crypto.Privatekey.fromHex(vector["spend_data"]["priv_keys"][0]),
                            transaction.Sighash.fromByte($.hexToBytes(vector["spend_data"]["sig_hashes"][0]))
                        );

                        let solver = new solvers.P2shSolver(redeem_script, redeem_solver);
                        let signature = solver.solve(vector["digests"]);
                        assert.equal(signature.scriptSig.toHex(), vector["script_sig"]);
                    } else if (vector["spend_data"]["redeem_script"]["type"] === "multisig") {
                        const privkeys = _.map(vector["spend_data"]["priv_keys"], hexkey => {
                            return crypto.Privatekey.fromHex(hexkey);
                        });

                        const sighashes = _.map(vector["spend_data"]["sig_hashes"], sighash => {
                            return transaction.Sighash.fromByte($.hexToBytes(sighash));
                        });
                        redeem_solver = new solvers.MultiSigSolver(privkeys, sighashes);

                        let solver = new solvers.P2shSolver(redeem_script, redeem_solver);
                        let signature = solver.solve(vector["digests"]);
                        assert.equal(signature.scriptSig.toHex(), vector["script_sig"]);
                    } else if (
                        vector["spend_data"]["redeem_script"]["type"].substring(0, 18) ===
                        "[relativetimelock]"
                    ) {
                        const tl_type = getTimelockedType(vector["spend_data"]["redeem_script"]["type"])
                            .tl_type;
                        if (tl_type === "multisig") {
                            const privkeys = _.map(vector["spend_data"]["priv_keys"], hexkey => {
                                return crypto.Privatekey.fromHex(hexkey);
                            });

                            const sighashes = _.map(vector["spend_data"]["sig_hashes"], sighash => {
                                return transaction.Sighash.fromByte($.hexToBytes(sighash));
                            });
                            let rtl_inner_solver = new solvers.MultiSigSolver(privkeys, sighashes);
                            redeem_solver = new solvers.RelativeTimelockSolver(rtl_inner_solver);

                            let solver = new solvers.P2shSolver(redeem_script, redeem_solver);
                            let signature = solver.solve(vector["digests"]);
                            assert.equal(signature.scriptSig.toHex(), vector["script_sig"]);
                        } else if (tl_type === "p2pkh") {
                            const privkey = crypto.Privatekey.fromHex(vector["spend_data"]["priv_keys"][0]);
                            const sighash = transaction.Sighash.fromByte(
                                $.hexToBytes(vector["spend_data"]["sig_hashes"][0])
                            );
                            let rtl_inner_solver = new solvers.P2pkhSolver(privkey, sighash);
                            redeem_solver = new solvers.RelativeTimelockSolver(rtl_inner_solver);

                            let solver = new solvers.P2shSolver(redeem_script, redeem_solver);
                            let signature = solver.solve(vector["digests"]);
                            assert.equal(signature.scriptSig.toHex(), vector["script_sig"]);
                        }
                    } else if (vector["spend_data"]["redeem_script"]["type"] === "p2wpkhv0") {
                        redeem_solver = new solvers.P2wpkhV0Solver(
                            crypto.Privatekey.fromHex(vector["spend_data"]["priv_keys"][0]),
                            transaction.Sighash.fromByte($.hexToBytes(vector["spend_data"]["sig_hashes"][0]))
                        );
                        let solver = new solvers.P2shSolver(redeem_script, redeem_solver);
                        let signature = solver.solve(vector["digests"]);
                        let ser_witness = signature.witness.serialize();
                        assert.equal(signature.scriptSig.toHex(), vector["script_sig"]);
                        assert.equal(ser_witness.toHex(0, ser_witness.capacity()), vector["witness"]);
                    } else if (vector["spend_data"]["redeem_script"]["type"].substring(0, 2) === "if") {
                        let inner_solver;
                        const branches = getBranchesTypes(vector["spend_data"]["redeem_script"]["type"]);
                        const valid_branch = vector["spend_data"]["branches"][0];
                        const inner_type = valid_branch === 1 ? branches.if_b : branches.else_b;
                        if (inner_type === "p2pkh") {
                            const privkey = crypto.Privatekey.fromHex(vector["spend_data"]["priv_keys"][0]);
                            const sighash = transaction.Sighash.fromByte(
                                $.hexToBytes(vector["spend_data"]["sig_hashes"][0])
                            );
                            inner_solver = new solvers.P2pkhSolver(privkey, sighash);
                            redeem_solver = new solvers.IfElseSolver(valid_branch, inner_solver);
                            let solver = new solvers.P2shSolver(redeem_script, redeem_solver);
                            let signature = solver.solve(vector["digests"]);
                            assert.equal(signature.scriptSig.toHex(), vector["script_sig"]);
                        } else if (inner_type === "multisig") {
                            const privkeys = _.map(vector["spend_data"]["priv_keys"], hexkey => {
                                return crypto.Privatekey.fromHex(hexkey);
                            });

                            const sighashes = _.map(vector["spend_data"]["sig_hashes"], sighash => {
                                return transaction.Sighash.fromByte($.hexToBytes(sighash));
                            });
                            inner_solver = new solvers.MultiSigSolver(privkeys, sighashes);
                            redeem_solver = new solvers.IfElseSolver(valid_branch, inner_solver);
                            let solver = new solvers.P2shSolver(redeem_script, redeem_solver);
                            let signature = solver.solve(vector["digests"]);
                            assert.equal(signature.scriptSig.toHex(), vector["script_sig"]);
                        } else if (inner_type.substring(0, 18) === "[relativetimelock]") {
                            const tl_type = getTimelockedType(inner_type).tl_type;
                            if (tl_type === "multisig") {
                                const privkeys = _.map(vector["spend_data"]["priv_keys"], hexkey => {
                                    return crypto.Privatekey.fromHex(hexkey);
                                });

                                const sighashes = _.map(vector["spend_data"]["sig_hashes"], sighash => {
                                    return transaction.Sighash.fromByte($.hexToBytes(sighash));
                                });
                                let rtl_inner_solver = new solvers.MultiSigSolver(privkeys, sighashes);
                                inner_solver = new solvers.RelativeTimelockSolver(rtl_inner_solver);
                                redeem_solver = new solvers.IfElseSolver(valid_branch, inner_solver);
                                let solver = new solvers.P2shSolver(redeem_script, redeem_solver);
                                let signature = solver.solve(vector["digests"]);
                                assert.equal(signature.scriptSig.toHex(), vector["script_sig"]);
                            } else if (tl_type === "p2pkh") {
                                const privkey = crypto.Privatekey.fromHex(
                                    vector["spend_data"]["priv_keys"][0]
                                );
                                const sighash = transaction.Sighash.fromByte(
                                    $.hexToBytes(vector["spend_data"]["sig_hashes"][0])
                                );
                                let rtl_inner_solver = new solvers.P2pkhSolver(privkey, sighash);
                                inner_solver = new solvers.RelativeTimelockSolver(rtl_inner_solver);
                                redeem_solver = new solvers.IfElseSolver(valid_branch, inner_solver);
                                let solver = new solvers.P2shSolver(redeem_script, redeem_solver);
                                let signature = solver.solve(vector["digests"]);
                                assert.equal(signature.scriptSig.toHex(), vector["script_sig"]);
                            }
                        }
                    } else if (vector["spend_data"]["redeem_script"]["type"] === "p2wshv0") {
                        const witness_script = scripts.ScriptPubKey.fromHex(
                            vector["spend_data"]["witness_script"]["hex"]
                        );
                        let witness_script_solver;
                        if (vector["spend_data"]["witness_script"]["type"] === "p2pkh") {
                            const privkey = crypto.Privatekey.fromHex(vector["spend_data"]["priv_keys"][0]);
                            const sighash = transaction.Sighash.fromByte(
                                $.hexToBytes(vector["spend_data"]["sig_hashes"][0])
                            );
                            witness_script_solver = new solvers.P2pkhSolver(privkey, sighash);
                            redeem_solver = new solvers.P2wshV0Solver(witness_script, witness_script_solver);
                            let solver = new solvers.P2shSolver(redeem_script, redeem_solver);
                            let signature = solver.solve(vector["digests"]);
                            let ser_witness = signature.witness.serialize();
                            assert.equal(signature.scriptSig.toHex(), vector["script_sig"]);
                            assert.equal(ser_witness.toHex(0, ser_witness.capacity()), vector["witness"]);
                        } else if (vector["spend_data"]["witness_script"]["type"] === "multisig") {
                            const privkeys = _.map(vector["spend_data"]["priv_keys"], hexkey => {
                                return crypto.Privatekey.fromHex(hexkey);
                            });

                            const sighashes = _.map(vector["spend_data"]["sig_hashes"], sighash => {
                                return transaction.Sighash.fromByte($.hexToBytes(sighash));
                            });
                            witness_script_solver = new solvers.MultiSigSolver(privkeys, sighashes);

                            redeem_solver = new solvers.P2wshV0Solver(witness_script, witness_script_solver);
                            let solver = new solvers.P2shSolver(redeem_script, redeem_solver);
                            let signature = solver.solve(vector["digests"]);
                            let ser_witness = signature.witness.serialize();
                            assert.equal(signature.scriptSig.toHex(), vector["script_sig"]);
                            assert.equal(ser_witness.toHex(0, ser_witness.capacity()), vector["witness"]);
                        } else if (
                            vector["spend_data"]["witness_script"]["type"].substring(0, 18) ===
                            "[relativetimelock]"
                        ) {
                            const tl_type = getTimelockedType(vector["spend_data"]["witness_script"]["type"])
                                .tl_type;
                            if (tl_type === "multisig") {
                                const privkeys = _.map(vector["spend_data"]["priv_keys"], hexkey => {
                                    return crypto.Privatekey.fromHex(hexkey);
                                });

                                const sighashes = _.map(vector["spend_data"]["sig_hashes"], sighash => {
                                    return transaction.Sighash.fromByte($.hexToBytes(sighash));
                                });
                                let rtl_inner_solver = new solvers.MultiSigSolver(privkeys, sighashes);
                                witness_script_solver = new solvers.RelativeTimelockSolver(rtl_inner_solver);

                                redeem_solver = new solvers.P2wshV0Solver(
                                    witness_script,
                                    witness_script_solver
                                );
                                let solver = new solvers.P2shSolver(redeem_script, redeem_solver);
                                let signature = solver.solve(vector["digests"]);
                                let ser_witness = signature.witness.serialize();
                                assert.equal(signature.scriptSig.toHex(), vector["script_sig"]);
                                assert.equal(ser_witness.toHex(0, ser_witness.capacity()), vector["witness"]);
                            } else if (tl_type === "p2pkh") {
                                const privkey = crypto.Privatekey.fromHex(
                                    vector["spend_data"]["priv_keys"][0]
                                );
                                const sighash = transaction.Sighash.fromByte(
                                    $.hexToBytes(vector["spend_data"]["sig_hashes"][0])
                                );
                                let rtl_inner_solver = new solvers.P2pkhSolver(privkey, sighash);
                                witness_script_solver = new solvers.RelativeTimelockSolver(rtl_inner_solver);
                                redeem_solver = new solvers.P2wshV0Solver(
                                    witness_script,
                                    witness_script_solver
                                );
                                let solver = new solvers.P2shSolver(redeem_script, redeem_solver);
                                let signature = solver.solve(vector["digests"]);
                                let ser_witness = signature.witness.serialize();
                                assert.equal(signature.scriptSig.toHex(), vector["script_sig"]);
                                assert.equal(ser_witness.toHex(0, ser_witness.capacity()), vector["witness"]);
                            }
                        } else if (
                            vector["spend_data"]["witness_script"]["type"].substring(0, 2) === "if"
                        ) {
                            let inner_solver;
                            const branches = getBranchesTypes(
                                vector["spend_data"]["witness_script"]["type"]
                            );
                            const valid_branch = vector["spend_data"]["branches"][0];
                            const inner_type = valid_branch === 1 ? branches.if_b : branches.else_b;
                            if (inner_type === "p2pkh") {
                                const privkey = crypto.Privatekey.fromHex(
                                    vector["spend_data"]["priv_keys"][0]
                                );
                                const sighash = transaction.Sighash.fromByte(
                                    $.hexToBytes(vector["spend_data"]["sig_hashes"][0])
                                );
                                inner_solver = new solvers.P2pkhSolver(privkey, sighash);
                                witness_script_solver = new solvers.IfElseSolver(valid_branch, inner_solver);
                                redeem_solver = new solvers.P2wshV0Solver(
                                    witness_script,
                                    witness_script_solver
                                );
                                let solver = new solvers.P2shSolver(redeem_script, redeem_solver);
                                let signature = solver.solve(vector["digests"]);
                                let ser_witness = signature.witness.serialize();
                                assert.equal(signature.scriptSig.toHex(), vector["script_sig"]);
                                assert.equal(ser_witness.toHex(0, ser_witness.capacity()), vector["witness"]);
                            } else if (inner_type === "multisig") {
                                const privkeys = _.map(vector["spend_data"]["priv_keys"], hexkey => {
                                    return crypto.Privatekey.fromHex(hexkey);
                                });

                                const sighashes = _.map(vector["spend_data"]["sig_hashes"], sighash => {
                                    return transaction.Sighash.fromByte($.hexToBytes(sighash));
                                });
                                inner_solver = new solvers.MultiSigSolver(privkeys, sighashes);
                                witness_script_solver = new solvers.IfElseSolver(valid_branch, inner_solver);
                                redeem_solver = new solvers.P2wshV0Solver(
                                    witness_script,
                                    witness_script_solver
                                );
                                let solver = new solvers.P2shSolver(redeem_script, redeem_solver);
                                let signature = solver.solve(vector["digests"]);
                                let ser_witness = signature.witness.serialize();
                                assert.equal(signature.scriptSig.toHex(), vector["script_sig"]);
                                assert.equal(ser_witness.toHex(0, ser_witness.capacity()), vector["witness"]);
                            } else if (inner_type.substring(0, 18) === "[relativetimelock]") {
                                const tl_type = getTimelockedType(inner_type).tl_type;
                                if (tl_type === "multisig") {
                                    const privkeys = _.map(vector["spend_data"]["priv_keys"], hexkey => {
                                        return crypto.Privatekey.fromHex(hexkey);
                                    });

                                    const sighashes = _.map(vector["spend_data"]["sig_hashes"], sighash => {
                                        return transaction.Sighash.fromByte($.hexToBytes(sighash));
                                    });
                                    let rtl_inner_solver = new solvers.MultiSigSolver(privkeys, sighashes);
                                    inner_solver = new solvers.RelativeTimelockSolver(rtl_inner_solver);
                                    witness_script_solver = new solvers.IfElseSolver(valid_branch, inner_solver);
                                    redeem_solver = new solvers.P2wshV0Solver(
                                        witness_script,
                                        witness_script_solver
                                    );
                                    let solver = new solvers.P2shSolver(redeem_script, redeem_solver);
                                    let signature = solver.solve(vector["digests"]);
                                    let ser_witness = signature.witness.serialize();
                                    assert.equal(signature.scriptSig.toHex(), vector["script_sig"]);
                                    assert.equal(
                                        ser_witness.toHex(0, ser_witness.capacity()),
                                        vector["witness"]
                                    );
                                } else if (tl_type === "p2pkh") {
                                    const privkey = crypto.Privatekey.fromHex(
                                        vector["spend_data"]["priv_keys"][0]
                                    );
                                    const sighash = transaction.Sighash.fromByte(
                                        $.hexToBytes(vector["spend_data"]["sig_hashes"][0])
                                    );
                                    let rtl_inner_solver = new solvers.P2pkhSolver(privkey, sighash);
                                    inner_solver = new solvers.RelativeTimelockSolver(rtl_inner_solver);
                                    witness_script_solver = new solvers.IfElseSolver(valid_branch, inner_solver);
                                    redeem_solver = new solvers.P2wshV0Solver(
                                        witness_script,
                                        witness_script_solver
                                    );
                                    let solver = new solvers.P2shSolver(redeem_script, redeem_solver);
                                    let signature = solver.solve(vector["digests"]);
                                    let ser_witness = signature.witness.serialize();
                                    assert.equal(signature.scriptSig.toHex(), vector["script_sig"]);
                                    assert.equal(
                                        ser_witness.toHex(0, ser_witness.capacity()),
                                        vector["witness"]
                                    );
                                }
                            }
                        }
                    }
                }
            });
        });
    });
    describe("P2wshV0Solver", function () {
        it("can compute the correct scriptSig", function () {
            _.forEach(sigs_vectors, vector => {
                if (vector["script_pubkey"]["type"] === "p2wshv0") {
                    const witness_script = scripts.ScriptPubKey.fromHex(
                        vector["spend_data"]["witness_script"]["hex"]
                    );
                    let witness_script_solver;
                    if (vector["spend_data"]["witness_script"]["type"] === "p2pkh") {
                        const privkey = crypto.Privatekey.fromHex(vector["spend_data"]["priv_keys"][0]);
                        const sighash = transaction.Sighash.fromByte(
                            $.hexToBytes(vector["spend_data"]["sig_hashes"][0])
                        );
                        witness_script_solver = new solvers.P2pkhSolver(privkey, sighash);
                        const solver = new solvers.P2wshV0Solver(witness_script, witness_script_solver);
                        let signature = solver.solve(vector["digests"]);
                        let ser_witness = signature.witness.serialize();
                        assert.equal(signature.scriptSig.toHex(), vector["script_sig"]);
                        assert.equal(ser_witness.toHex(0, ser_witness.capacity()), vector["witness"]);

                    } else if (vector["spend_data"]["witness_script"]["type"] === "p2pk") {
                        const privkey = crypto.Privatekey.fromHex(vector["spend_data"]["priv_keys"][0]);
                        const sighash = transaction.Sighash.fromByte(
                            $.hexToBytes(vector["spend_data"]["sig_hashes"][0])
                        );
                        witness_script_solver = new solvers.P2pkSolver(privkey, sighash);
                        const solver = new solvers.P2wshV0Solver(witness_script, witness_script_solver);
                        let signature = solver.solve(vector["digests"]);
                        let ser_witness = signature.witness.serialize();
                        assert.equal(signature.scriptSig.toHex(), vector["script_sig"]);
                        assert.equal(ser_witness.toHex(0, ser_witness.capacity()), vector["witness"]);

                    } else if (vector["spend_data"]["witness_script"]["type"] === "multisig") {
                        const privkeys = _.map(vector["spend_data"]["priv_keys"], hexkey => {
                            return crypto.Privatekey.fromHex(hexkey);
                        });

                        const sighashes = _.map(vector["spend_data"]["sig_hashes"], sighash => {
                            return transaction.Sighash.fromByte($.hexToBytes(sighash));
                        });
                        witness_script_solver = new solvers.MultiSigSolver(privkeys, sighashes);

                        let solver = new solvers.P2wshV0Solver(witness_script, witness_script_solver);
                        let signature = solver.solve(vector["digests"]);
                        let ser_witness = signature.witness.serialize();
                        assert.equal(signature.scriptSig.toHex(), vector["script_sig"]);
                        assert.equal(ser_witness.toHex(0, ser_witness.capacity()), vector["witness"]);
                    } else if (
                        vector["spend_data"]["witness_script"]["type"].substring(0, 18) ===
                        "[relativetimelock]"
                    ) {
                        const tl_type = getTimelockedType(vector["spend_data"]["witness_script"]["type"])
                            .tl_type;
                        if (tl_type === "multisig") {
                            const privkeys = _.map(vector["spend_data"]["priv_keys"], hexkey => {
                                return crypto.Privatekey.fromHex(hexkey);
                            });

                            const sighashes = _.map(vector["spend_data"]["sig_hashes"], sighash => {
                                return transaction.Sighash.fromByte($.hexToBytes(sighash));
                            });
                            let rtl_inner_solver = new solvers.MultiSigSolver(privkeys, sighashes);
                            witness_script_solver = new solvers.RelativeTimelockSolver(rtl_inner_solver);

                            let solver = new solvers.P2wshV0Solver(witness_script, witness_script_solver);
                            let signature = solver.solve(vector["digests"]);
                            let ser_witness = signature.witness.serialize();
                            assert.equal(signature.scriptSig.toHex(), vector["script_sig"]);
                            assert.equal(ser_witness.toHex(0, ser_witness.capacity()), vector["witness"]);
                        } else if (tl_type === "p2pkh") {
                            const privkey = crypto.Privatekey.fromHex(vector["spend_data"]["priv_keys"][0]);
                            const sighash = transaction.Sighash.fromByte(
                                $.hexToBytes(vector["spend_data"]["sig_hashes"][0])
                            );
                            let rtl_inner_solver = new solvers.P2pkhSolver(privkey, sighash);
                            witness_script_solver = new solvers.RelativeTimelockSolver(rtl_inner_solver);
                            let solver = new solvers.P2wshV0Solver(witness_script, witness_script_solver);
                            let signature = solver.solve(vector["digests"]);
                            let ser_witness = signature.witness.serialize();
                            assert.equal(signature.scriptSig.toHex(), vector["script_sig"]);
                            assert.equal(ser_witness.toHex(0, ser_witness.capacity()), vector["witness"]);
                        }
                    } else if (vector["spend_data"]["witness_script"]["type"].substring(0, 2) === "if") {
                        let inner_solver;
                        const branches = getBranchesTypes(vector["spend_data"]["witness_script"]["type"]);
                        const valid_branch = vector["spend_data"]["branches"][0];
                        const inner_type = valid_branch === 1 ? branches.if_b : branches.else_b;
                        if (inner_type === "p2pkh") {
                            const privkey = crypto.Privatekey.fromHex(vector["spend_data"]["priv_keys"][0]);
                            const sighash = transaction.Sighash.fromByte(
                                $.hexToBytes(vector["spend_data"]["sig_hashes"][0])
                            );
                            inner_solver = new solvers.P2pkhSolver(privkey, sighash);
                            witness_script_solver = new solvers.IfElseSolver(valid_branch, inner_solver);
                            let solver = new solvers.P2wshV0Solver(witness_script, witness_script_solver);
                            let signature = solver.solve(vector["digests"]);
                            let ser_witness = signature.witness.serialize();
                            assert.equal(signature.scriptSig.toHex(), vector["script_sig"]);
                            assert.equal(ser_witness.toHex(0, ser_witness.capacity()), vector["witness"]);
                        } else if (inner_type === "multisig") {
                            const privkeys = _.map(vector["spend_data"]["priv_keys"], hexkey => {
                                return crypto.Privatekey.fromHex(hexkey);
                            });

                            const sighashes = _.map(vector["spend_data"]["sig_hashes"], sighash => {
                                return transaction.Sighash.fromByte($.hexToBytes(sighash));
                            });
                            inner_solver = new solvers.MultiSigSolver(privkeys, sighashes);
                            witness_script_solver = new solvers.IfElseSolver(valid_branch, inner_solver);
                            let solver = new solvers.P2wshV0Solver(witness_script, witness_script_solver);
                            let signature = solver.solve(vector["digests"]);
                            let ser_witness = signature.witness.serialize();
                            assert.equal(signature.scriptSig.toHex(), vector["script_sig"]);
                            assert.equal(ser_witness.toHex(0, ser_witness.capacity()), vector["witness"]);
                        } else if (inner_type.substring(0, 18) === "[relativetimelock]") {
                            const tl_type = getTimelockedType(inner_type).tl_type;
                            if (tl_type === "multisig") {
                                const privkeys = _.map(vector["spend_data"]["priv_keys"], hexkey => {
                                    return crypto.Privatekey.fromHex(hexkey);
                                });

                                const sighashes = _.map(vector["spend_data"]["sig_hashes"], sighash => {
                                    return transaction.Sighash.fromByte($.hexToBytes(sighash));
                                });
                                let rtl_inner_solver = new solvers.MultiSigSolver(privkeys, sighashes);
                                inner_solver = new solvers.RelativeTimelockSolver(rtl_inner_solver);
                                witness_script_solver = new solvers.IfElseSolver(valid_branch, inner_solver);
                                let solver = new solvers.P2wshV0Solver(witness_script, witness_script_solver);
                                let signature = solver.solve(vector["digests"]);
                                let ser_witness = signature.witness.serialize();
                                assert.equal(signature.scriptSig.toHex(), vector["script_sig"]);
                                assert.equal(ser_witness.toHex(0, ser_witness.capacity()), vector["witness"]);
                            } else if (tl_type === "p2pkh") {
                                const privkey = crypto.Privatekey.fromHex(
                                    vector["spend_data"]["priv_keys"][0]
                                );
                                const sighash = transaction.Sighash.fromByte(
                                    $.hexToBytes(vector["spend_data"]["sig_hashes"][0])
                                );
                                let rtl_inner_solver = new solvers.P2pkhSolver(privkey, sighash);
                                inner_solver = new solvers.RelativeTimelockSolver(rtl_inner_solver);
                                witness_script_solver = new solvers.IfElseSolver(valid_branch, inner_solver);
                                let solver = new solvers.P2wshV0Solver(witness_script, witness_script_solver);
                                let signature = solver.solve(vector["digests"]);
                                let ser_witness = signature.witness.serialize();
                                assert.equal(signature.scriptSig.toHex(), vector["script_sig"]);
                                assert.equal(ser_witness.toHex(0, ser_witness.capacity()), vector["witness"]);
                            }
                        }
                    }
                }
            });
        });
    });
    describe("RelativeTimelockSolver", function () {
        it("can compute the correct scriptSig", function () {
            _.forEach(sigs_vectors, vector => {
                if (vector["script_pubkey"]["type"].substring(0, 18) === "[relativetimelock]") {
                    let inner_solver;
                    const tl_type = getTimelockedType(vector["script_pubkey"]["type"]).tl_type;
                    if (tl_type === "multisig") {
                        const privkeys = _.map(vector["spend_data"]["priv_keys"], hexkey => {
                            return crypto.Privatekey.fromHex(hexkey);
                        });

                        const sighashes = _.map(vector["spend_data"]["sig_hashes"], sighash => {
                            return transaction.Sighash.fromByte($.hexToBytes(sighash));
                        });
                        inner_solver = new solvers.MultiSigSolver(privkeys, sighashes);
                        let solver = new solvers.RelativeTimelockSolver(inner_solver);
                        let signature = solver.solve(vector["digests"]);
                        assert.equal(signature.scriptSig.toHex(), vector["script_sig"]);
                    } else if (tl_type === "p2pkh") {
                        const privkey = crypto.Privatekey.fromHex(vector["spend_data"]["priv_keys"][0]);
                        const sighash = transaction.Sighash.fromByte(
                            $.hexToBytes(vector["spend_data"]["sig_hashes"][0])
                        );
                        inner_solver = new solvers.P2pkhSolver(privkey, sighash);
                        let solver = new solvers.RelativeTimelockSolver(inner_solver);
                        let signature = solver.solve(vector["digests"]);
                        assert.equal(signature.scriptSig.toHex(), vector["script_sig"]);
                    }
                }
            });
        });
    });
    describe("IfElseSolver", function () {
        it("can compute the correct scriptSig", function () {
            _.forEach(sigs_vectors, vector => {
                if (vector["script_pubkey"]["type"].substring(0, 2) === "if") {
                    let inner_solver;
                    const branches = getBranchesTypes(vector["script_pubkey"]["type"]);
                    const valid_branch = vector["spend_data"]["branches"][0];
                    const inner_type = valid_branch === 1 ? branches.if_b : branches.else_b;
                    if (inner_type === "p2pkh") {
                        const privkey = crypto.Privatekey.fromHex(vector["spend_data"]["priv_keys"][0]);
                        const sighash = transaction.Sighash.fromByte(
                            $.hexToBytes(vector["spend_data"]["sig_hashes"][0])
                        );
                        inner_solver = new solvers.P2pkhSolver(privkey, sighash);
                        let solver = new solvers.IfElseSolver(valid_branch, inner_solver);
                        let signature = solver.solve(vector["digests"]);
                        assert.equal(signature.scriptSig.toHex(), vector["script_sig"]);
                    } else if (inner_type === "p2pk") {
                        const privkey = crypto.Privatekey.fromHex(vector["spend_data"]["priv_keys"][0]);
                        const sighash = transaction.Sighash.fromByte(
                            $.hexToBytes(vector["spend_data"]["sig_hashes"][0])
                        );
                        inner_solver = new solvers.P2pkSolver(privkey, sighash);
                        let solver = new solvers.IfElseSolver(valid_branch, inner_solver);
                        let signature = solver.solve(vector["digests"]);
                        assert.equal(signature.scriptSig.toHex(), vector["script_sig"]);
                    } else if (inner_type === "multisig") {
                        const privkeys = _.map(vector["spend_data"]["priv_keys"], hexkey => {
                            return crypto.Privatekey.fromHex(hexkey);
                        });

                        const sighashes = _.map(vector["spend_data"]["sig_hashes"], sighash => {
                            return transaction.Sighash.fromByte($.hexToBytes(sighash));
                        });
                        inner_solver = new solvers.MultiSigSolver(privkeys, sighashes);
                        let solver = new solvers.IfElseSolver(valid_branch, inner_solver);
                        let signature = solver.solve(vector["digests"]);
                        assert.equal(signature.scriptSig.toHex(), vector["script_sig"]);
                    } else if (inner_type.substring(0, 18) === "[relativetimelock]") {
                        const tl_type = getTimelockedType(inner_type).tl_type;
                        if (tl_type === "multisig") {
                            const privkeys = _.map(vector["spend_data"]["priv_keys"], hexkey => {
                                return crypto.Privatekey.fromHex(hexkey);
                            });

                            const sighashes = _.map(vector["spend_data"]["sig_hashes"], sighash => {
                                return transaction.Sighash.fromByte($.hexToBytes(sighash));
                            });
                            let rtl_inner_solver = new solvers.MultiSigSolver(privkeys, sighashes);
                            inner_solver = new solvers.RelativeTimelockSolver(rtl_inner_solver);
                            const solver = new solvers.IfElseSolver(valid_branch, inner_solver);
                            let signature = solver.solve(vector["digests"]);
                            assert.equal(signature.scriptSig.toHex(), vector["script_sig"]);
                        } else if (tl_type === "p2pkh") {
                            const privkey = crypto.Privatekey.fromHex(vector["spend_data"]["priv_keys"][0]);
                            const sighash = transaction.Sighash.fromByte(
                                $.hexToBytes(vector["spend_data"]["sig_hashes"][0])
                            );
                            let rtl_inner_solver = new solvers.P2pkhSolver(privkey, sighash);
                            inner_solver = new solvers.RelativeTimelockSolver(rtl_inner_solver);
                            const solver = new solvers.IfElseSolver(valid_branch, inner_solver);
                            let signature = solver.solve(vector["digests"]);
                            assert.equal(signature.scriptSig.toHex(), vector["script_sig"]);
                        }
                    }
                }
            });
        });
    });
});

describe("Structs", function () {
    describe("Transaction", function () {
        it("can deserialize and serialize", function () {
            for (var i = 0; i < transactions.length; i++) {
                const tx = transaction.Transaction.fromHex(transactions[i]["raw"]);
                const ser_tx = tx.serialize();
                assert.equal(transactions[i]["raw"], ser_tx.toHex(0, ser_tx.capacity()));
            }
        });
        it("can compute the txid", function () {
            for (var i = 0; i < transactions.length; i++) {
                const tx = transaction.Transaction.fromHex(transactions[i]["raw"]);
                assert.equal(transactions[i]["txid"], tx.txid);
            }
        });
        it("can compute the segwit txid", function () {
            for (var i = 0; i < segwit_data.length; i++) {
                let tx = transaction.Transaction.fromHex(segwit_data[i]["unsigned_tx"]);
                assert.equal(segwit_data[i]["txid"], tx.txid);
            }
        });
        it("can compute the hash of previous outputs", function () {
            for (var i = 0; i < segwit_data.length; i++) {
                let unsigned = transaction.Transaction.fromHex(segwit_data[i]["unsigned_tx"]);
                let hashPrevouts = unsigned.hashPrevouts();
                assert.equal(
                    hashPrevouts.toHex(0, hashPrevouts.capacity()),
                    segwit_data[i]["hash_prevouts"]
                );
            }
        });
        it("can compute the hash of inputs sequences", function () {
            for (var i = 0; i < segwit_data.length; i++) {
                let unsigned = transaction.Transaction.fromHex(segwit_data[i]["unsigned_tx"]);
                let hashSequence = unsigned.hashSequence();
                assert.equal(
                    hashSequence.toHex(0, hashSequence.capacity()),
                    segwit_data[i]["hash_sequence"]
                );
            }
        });
        it("can compute the hash of its outputs", function () {
            for (var i = 0; i < segwit_data.length; i++) {
                let unsigned = transaction.Transaction.fromHex(segwit_data[i]["unsigned_tx"]);
                let hashOutputs = unsigned.hashOutputs();
                assert.equal(
                    hashOutputs.toHex(0, hashOutputs.capacity()),
                    segwit_data[i]["hash_outputs"]
                );
            }
        });

        it("can compute the digest preimage of its inputs", function () {
            for (var i = 0; i < digests.length; i++) {
                let unsigned = transaction.Transaction.fromHex(digests[i]["unsigned_tx"]);
                for (var j = 0; j < digests[i]["txins"].length; j++) {
                    let digest_preimage = unsigned.getDigestPreImage(
                        j,
                        digests[i]["txins"][j]["prev_script"]
                    );
                    assert.equal(
                        digest_preimage.toHex(0, digest_preimage.capacity()),
                        digests[i]["txins"][j]["digest_preimage"]
                    );
                }
            }
        });
        it("can compute the digest  of its inputs", function () {
            for (var i = 0; i < digests.length; i++) {
                let unsigned = transaction.Transaction.fromHex(digests[i]["unsigned_tx"]);
                for (var j = 0; j < digests[i]["txins"].length; j++) {
                    assert.equal(
                        unsigned.getDigest(j, digests[i]["txins"][j]["prev_script"]),
                        digests[i]["txins"][j]["digest"]
                    );
                }
            }
        });
        it("can compute the segwit digest preimage of its inputs", function () {
            for (var i = 0; i < segwit_data.length; i++) {
                let unsigned = transaction.Transaction.fromHex(segwit_data[i]["unsigned_tx"]);
                for (var j = 0; j < segwit_data[i]["txins"].length; j++) {
                    if ("digest_preimage" in segwit_data[i]["txins"][j]) {
                        let segwitdigest_preimage = unsigned.getSegwitDigestPreImage(
                            j,
                            segwit_data[i]["txins"][j]["prev_script"],
                            segwit_data[i]["txins"][j]["prev_amount"]
                        );
                        assert.equal(
                            segwitdigest_preimage.toHex(0, segwitdigest_preimage.capacity()),
                            segwit_data[i]["txins"][j]["digest_preimage"]
                        );
                    }
                }
            }
        });
        it("can compute the segwit digest of its inputs", function () {
            for (var i = 0; i < segwit_data.length; i++) {
                let unsigned = transaction.Transaction.fromHex(segwit_data[i]["unsigned_tx"]);
                for (var j = 0; j < segwit_data[i]["txins"].length; j++) {
                    if ("digest" in segwit_data[i]["txins"][j])
                        assert.equal(
                            unsigned.getSegwitDigest(
                                j,
                                segwit_data[i]["txins"][j]["prev_script"],
                                segwit_data[i]["txins"][j]["prev_amount"]
                            ),
                            segwit_data[i]["txins"][j]["digest"]
                        );
                }
            }
        });
        it("throws an error on incomplete parsing", function () {
            for (var i = 0; i < transactions.length; i++) {
                assert.throws(
                    () => transaction.Transaction.fromHex(transactions[i]["raw"] + "00"),
                    Error,
                    "Incomplete tx deserialization"
                );
            }
        });
    });
    describe("BlockHeader", function () {
        it("can deserialize and serialize", function () {
            for (var i = 0; i < blocks.length; i++) {
                const bh = BlockHeader.fromHex(blocks[i]["raw"]);
                const ser_bh = bh.serialize();
                const hex = ser_bh.toHex(0, ser_bh.capacity());
                assert.equal(blocks[i]["raw"].substring(0, hex.length), hex);
            }
        });
        it("can compute the block hash", function () {
            for (var i = 0; i < blocks.length; i++) {
                const bh = BlockHeader.fromHex(blocks[i]["raw"]);
                assert.equal(bh.blockHash(), blocks[i]["hash"]);
            }
        });
    });

    describe("Witness", function () {
        it("can be created fromHexArray", function () {
            let hexData = [
                "3045022100ebeb625c62d618c097fb1d54fef8bd3f57698bac191adca0a552725e" +
                "4f577afc022001814513b04c272c5c86c4a37dd55700be543dc5732db5176dce37" +
                "7f954bd88401"
                ,
                "03f5b78846b3420430e455df568e4bee061827704c36163699544a0e60660fb7cb"
            ];
            let witness = new transaction.Witness(
                hexData.map((hex) => new ByteBuffer.fromHex(hex))
            );
            assert.equal(witness.toHex(), transaction.Witness.fromHexArray(hexData).toHex());
        });
    });
    describe("Address", function () {
        it("can be converted to script", function () {
            for (let i = 0; i < test_scripts['p2pkh'].length; i++) {
                const addr = address.Address.fromBase58(test_scripts["p2pkh"][i]["address"]);
                const script = addr.toScript();
                assert.equal(script.toHex(), test_scripts["p2pkh"][i]["hex"]);
            }
            for (let i = 0; i < test_scripts['p2sh'].length; i++) {
                const addr = address.Address.fromBase58(test_scripts["p2sh"][i]["address"]);
                const script = addr.toScript();
                assert.equal(script.toHex(), test_scripts["p2sh"][i]["hex"]);
            }
        });
    });
    describe("SegwitAddress", function () {
        it("can convert from and to bech32", function () {
            for (let i = 0; i < segwitaddresses["p2wpkh"].length; i++) {
                const addr = address.SegwitAddress.fromBech32(segwitaddresses["p2wpkh"][i]["bech32"]);
                assert.equal(
                    addr.hash.toHex(0, addr.hash.capacity()),
                    segwitaddresses["p2wpkh"][i]["hash"]
                );
                const bech = addr.toBech32();
                assert.equal(bech, segwitaddresses["p2wpkh"][i]["bech32"]);
            }

            for (let i = 0; i < segwitaddresses["p2wsh"].length; i++) {
                const addr = address.SegwitAddress.fromBech32(segwitaddresses["p2wsh"][i]["bech32"]);
                assert.equal(
                    addr.hash.toHex(0, addr.hash.capacity()),
                    segwitaddresses["p2wsh"][i]["hash"]
                );
                const bech = addr.toBech32();

                assert.equal(bech, segwitaddresses["p2wsh"][i]["bech32"]);
            }

        });
        it("can be converted to script", function () {
            for (let i = 0; i < test_scripts['p2wpkh'].length; i++) {
                const addr = address.SegwitAddress.fromBech32(test_scripts["p2wpkh"][i]["address"]);
                const script = addr.toScript();
                assert.equal(script.toHex(), test_scripts["p2wpkh"][i]["hex"]);
            }
            for (let i = 0; i < test_scripts['p2wsh'].length; i++) {
                const addr = address.SegwitAddress.fromBech32(test_scripts["p2wsh"][i]["address"]);
                const script = addr.toScript();
                assert.equal(script.toHex(), test_scripts["p2wsh"][i]["hex"]);
            }
        });
    });
});
describe("Scripts", function () {
    describe.only("Script", function () {
        it("compiles asm to hex", function () {
            for (var key in test_scripts) {
                if (test_scripts.hasOwnProperty(key)) {
                    for (var i = 0; i < test_scripts[key].length; i++) {
                        if (test_scripts[key][i].hasOwnProperty("asm")) {
                            const hex = scripts.Script.compileToHex(test_scripts[key][i]["asm"]);
                            assert.equal(hex, test_scripts[key][i]["hex"]);
                        }
                    }
                }
            }
            for (var i = 0; i < scriptsigs.length; i++) {
                const hex = scripts.Script.compileToHex(scriptsigs[i]["asm"]);
                assert.equal(hex, scriptsigs[i]["hex"]);
            }
        });
    });
    describe("ScriptSig", function () {
        it("can be initialized from hex and converted to asm", function () {
            for (var i = 0; i < scriptsigs.length; i++) {
                const sc = scripts.ScriptSig.fromHex(scriptsigs[i]["hex"]);
                assert.equal(sc.toAsm(), scriptsigs[i]["asm"]);
            }
        });
        it("can be initialized from asm and converted to hex", function () {
            for (var i = 0; i < scriptsigs.length; i++) {
                const sc = scripts.ScriptSig.fromAsm(scriptsigs[i]["asm"]);
                assert.equal(sc.toHex(), scriptsigs[i]["hex"]);
            }
        });
        it("can be converted in witness format and back to scriptSig", function () {
            for (var i = 0; i < scriptsigs.length; i++) {
                const sc = scripts.ScriptSig.fromHex(scriptsigs[i]["hex"]);
                const wit = sc.toWitness();
                assert(wit instanceof transaction.Witness);
                const ser_wit = wit.serialize();
                assert.equal(ser_wit.toHex(0, ser_wit.capacity()), scriptsigs[i]["witness_hex"]);
                assert.equal(wit.toScriptSig().toHex(), scriptsigs[i]["hex"]);
            }
        });
    });
    describe("ScriptPubKey", function () {
        it("can compute a p2sh script hash", function () {
            for (var i = 0; i < test_scripts["p2pkh"].length; i++) {
                const spk = scripts.ScriptPubKey.fromHex(test_scripts["p2pkh"][i]["hex"]);
                const spk_h = spk.p2shHash();
                assert.equal(spk_h.toHex(0, spk_h.capacity()), test_scripts["p2pkh"][i]["p2shHash"]);
            }
        });
        it("can compute a p2wsh hash", function () {
            for (var i = 0; i < test_scripts["p2wsh"].length; i++) {
                const spk = scripts.ScriptPubKey.fromHex(test_scripts["p2wsh"][i]["hex"]);
                const spk_h = spk.p2wshHash();
                assert.equal(spk_h.toHex(0, spk_h.capacity()), test_scripts["p2wsh"][i]["hash"]);
            }
        });
    });

    describe("P2pkScript", function () {
        it("can be initialized from an uncompressed public key", function () {
            for (var i = 0; i < test_scripts['p2pk'].length; i++) {
                if (test_scripts["p2pk"][i]["keytype"] === "uncompressed") {
                    const pubkey = crypto.Publickey.fromHex(test_scripts["p2pk"][i]["pubkey"]);
                    const sc = new scripts.P2pkScript(pubkey);
                    assert(sc instanceof scripts.P2pkScript);
                    assert.equal(sc.toHex(), test_scripts["p2pk"][i]["hex"]);
                }
            }
        });
        it("can be initialized from a compressed public key", function () {
            for (var i = 0; i < test_scripts['p2pk'].length; i++) {
                if (test_scripts["p2pk"][i]["keytype"] === "compressed") {
                    const pubkey = crypto.Publickey.fromHex(test_scripts["p2pk"][i]["pubkey"]);
                    const sc = new scripts.P2pkScript(pubkey);
                    assert(sc instanceof scripts.P2pkScript);
                    assert.equal(sc.toHex(), test_scripts["p2pk"][i]["hex"]);
                }
            }
        });
    });
    describe("P2pkhScript", function () {
        it("can be initialized from a public key hash", function () {
            for (var i = 0; i < test_scripts["p2pkh"].length; i++) {
                const pkh = new ByteBuffer.fromHex(test_scripts["p2pkh"][i]["pubkeyhash"]);
                assert(pkh instanceof ByteBuffer);
                const sc = new scripts.P2pkhScript(pkh);
                assert.equal(sc.toHex(), test_scripts["p2pkh"][i]["hex"]);
                assert.equal(sc.type, "p2pkh");
                assert.equal(sc.pubkeyhash, pkh);
            }
        });
        it("can be initialized from an address", function () {
            for (var i = 0; i < test_scripts["p2pkh"].length; i++) {
                const addr = address.Address.fromBase58(test_scripts["p2pkh"][i]["address"]);
                assert(addr instanceof address.Address);
                const sc = new scripts.P2pkhScript(addr);
                assert.equal(sc.toHex(), test_scripts["p2pkh"][i]["hex"]);
                assert.equal(sc.type, "p2pkh");
                assert.equal(sc.pubkeyhash, addr.hash);
            }
        });
        it("can be initialized from a public key", function () {
            for (var i = 0; i < test_scripts["p2pkh"].length; i++) {
                const pk = crypto.Publickey.fromHex(test_scripts["p2pkh"][i]["pubkey"]);
                const pk_hash = pk.hash();
                assert(pk instanceof crypto.Publickey);
                const sc = new scripts.P2pkhScript(pk);
                assert.equal(sc.toHex(), test_scripts["p2pkh"][i]["hex"]);
                assert.equal(sc.type, "p2pkh");
                assert.equal(
                    sc.pubkeyhash.toHex(0, sc.pubkeyhash.capacity()),
                    pk_hash.toHex(0, pk_hash.capacity())
                );
            }
        });
        it("can return a p2pkh address", function () {
            for (var i = 0; i < test_scripts["p2pkh"].length; i++) {
                const pkh = new ByteBuffer.fromHex(test_scripts["p2pkh"][i]["pubkeyhash"]);
                const sc = new scripts.P2pkhScript(pkh);
                const addr = sc.getAddress();
                assert(addr instanceof address.Address);
                assert.equal(addr.type, "p2pkh");
                assert.equal(addr.hash, sc.pubkeyhash);
                assert.equal(addr.toBase58().toString("hex"), test_scripts["p2pkh"][i]["address"]);
            }
        });
    });
    describe("P2wpkhV0Script", function () {
        it("can be initialized from a segwit address", function () {
            for (var i = 0; i < segwitaddresses["p2wpkh"].length; i++) {
                const addr = address.SegwitAddress.fromBech32(segwitaddresses["p2wpkh"][i]["bech32"]);
                assert(addr instanceof address.SegwitAddress);
                const sc = new scripts.P2wpkhV0Script(addr);
                assert.equal(
                    sc.pubkeyhash.toHex(0, sc.pubkeyhash.capacity()),
                    segwitaddresses["p2wpkh"][i]["hash"]
                );
                assert.equal(addr.hash, sc.pubkeyhash);
            }
        });
    });
    describe("P2wshV0Script", function () {
        it("can be initialized from a segwit address", function () {
            for (var i = 0; i < segwitaddresses["p2wsh"].length; i++) {
                const addr = address.SegwitAddress.fromBech32(segwitaddresses["p2wsh"][i]["bech32"]);
                assert(addr instanceof address.SegwitAddress);
                const sc = new scripts.P2wshV0Script(addr);
                assert.equal(
                    sc.scripthash.toHex(0, sc.scripthash.capacity()),
                    segwitaddresses["p2wsh"][i]["hash"]
                );
                assert.equal(addr.hash, sc.scripthash);
            }
        });
    });
    describe("P2shScript", function () {
        it("can be initialized from a script hash", function () {
            for (var i = 0; i < test_scripts["p2sh"].length; i++) {
                const sh = new ByteBuffer.fromHex(test_scripts["p2sh"][i]["scripthash"]);
                assert(sh instanceof ByteBuffer);
                const sc = new scripts.P2shScript(sh);
                assert.equal(sc.toHex(), test_scripts["p2sh"][i]["hex"]);
                assert.equal(sc.type, "p2sh");
                assert.equal(
                    sc.scripthash.toHex(0, sc.scripthash.capacity()),
                    sh.toHex(0, sh.capacity())
                );
            }
        });
        it("can be initialized from an address", function () {
            for (var i = 0; i < test_scripts["p2sh"].length; i++) {
                const addr = address.Address.fromBase58(test_scripts["p2sh"][i]["address"]);
                assert(addr instanceof address.Address);
                const sc = new scripts.P2shScript(addr);
                assert.equal(sc.toHex(), test_scripts["p2sh"][i]["hex"]);
                assert.equal(sc.type, "p2sh");
                assert.equal(sc.scripthash, addr.hash);
            }
        });
        it("can be initialized from a p2pkh Script", function () {
            for (var i = 0; i < test_scripts["p2pkh"].length; i++) {
                const pkh = new ByteBuffer.fromHex(test_scripts["p2pkh"][i]["pubkeyhash"]);
                const p2pkh = new scripts.P2pkhScript(pkh);
                const p2sh = new scripts.P2shScript(p2pkh);
                assert(p2sh instanceof scripts.P2shScript);
                assert.equal(
                    p2sh.scripthash.toHex(0, p2sh.scripthash.capacity()),
                    test_scripts["p2pkh"][i]["p2shHash"]
                );
            }
        });
        it("can be initialized from a p2pk Script", function () {
            for (var i = 0; i < test_scripts["p2pk"].length; i++) {
                const pk = new ByteBuffer.fromHex(test_scripts["p2pk"][i]["pubkey"]);
                const p2pk = new scripts.P2pkScript(pk);
                const p2sh = new scripts.P2shScript(p2pk);
                assert(p2sh instanceof scripts.P2shScript);
                assert.equal(
                    p2sh.scripthash.toHex(0, p2sh.scripthash.capacity()),
                    test_scripts["p2pk"][i]["p2shHash"]
                );
            }
        });
        it("can be initialized from a multisig script", function () {
            for (var i = 0; i < test_scripts["multisig"].length; i++) {
                let data = test_scripts["multisig"][i]["data"];
                data = _.map(data, function (element, index) {
                    if (index === 0 || index === data.length - 1) return element;
                    return crypto.Publickey.fromHex(element);
                });
                const msc = new scripts.MultiSigScript(data);
                assert(msc instanceof scripts.MultiSigScript);
                const p2sh = new scripts.P2shScript(msc);
                assert.equal(
                    p2sh.scripthash.toHex(0, p2sh.scripthash.capacity()),
                    test_scripts["multisig"][i]["p2shHash"]
                );
            }
        });
        it("can be initialized from a relative timelock script", function () {
            for (var i = 0; i < test_scripts["relative_timelock"].length; i++) {
                const sc = new scripts.RelativeTimelockScript(
                    test_scripts["relative_timelock"][i]["data"]
                );

                assert(sc instanceof scripts.RelativeTimelockScript);
                const p2sh = new scripts.P2shScript(sc);
                assert.equal(
                    p2sh.scripthash.toHex(0, p2sh.scripthash.capacity()),
                    test_scripts["relative_timelock"][i]["p2shHash"]
                );
            }
        });
        it("can be initialized from a timelock script", function () {
            for (var i = 0; i < test_scripts["timelock"].length; i++) {
                const sc = new scripts.TimelockScript(
                    test_scripts["timelock"][i]["data"]
                );
                assert(sc instanceof scripts.TimelockScript);
                const p2sh = new scripts.P2shScript(sc);
                assert.equal(
                    p2sh.scripthash.toHex(0, p2sh.scripthash.capacity()),
                    test_scripts["timelock"][i]["p2shHash"]
                );
            }
        });
        it("can be initialized from an if-else script", function () {
            for (var i = 0; i < test_scripts["if_else"].length; i++) {
                const if_script = test_scripts["if_else"][i]["if_script"];
                const else_script = test_scripts["if_else"][i]["else_script"];
                const sc = new scripts.IfElseScript([if_script, else_script]);
                assert(sc instanceof scripts.IfElseScript);
                const p2sh = new scripts.P2shScript(sc);
                assert.equal(
                    p2sh.scripthash.toHex(0, p2sh.scripthash.capacity()),
                    test_scripts["if_else"][i]["p2shHash"]
                );
            }
        });
        it("can return a p2sh address", function () {
            for (var i = 0; i < test_scripts["p2sh"].length; i++) {
                const sh = new ByteBuffer.fromHex(test_scripts["p2sh"][i]["scripthash"]);
                const sc = new scripts.P2shScript(sh);
                const addr = sc.getAddress();
                assert(addr instanceof address.Address);
                assert.equal(addr.type, "p2sh");
                assert.equal(addr.hash, sc.scripthash);
                assert.equal(addr.toBase58().toString("hex"), test_scripts["p2sh"][i]["address"]);
            }
        });
    });
    describe("MultisigScript", function () {
        it("can be initialized from an array of arguments", function () {
            for (var i = 0; i < test_scripts["multisig"].length; i++) {
                let data = test_scripts["multisig"][i]["data"];
                data = _.map(data, function (element, index) {
                    if (index === 0 || index === data.length - 1) return element;
                    return crypto.Publickey.fromHex(element);
                });
                const msc = new scripts.MultiSigScript(data);
                assert(msc instanceof scripts.MultiSigScript);
                assert.equal(msc.toHex(), test_scripts["multisig"][i]["hex"]);
            }
        });
        it("throws an error on inconsistent arguments", function () {
            for (var i = 0; i < test_scripts["multisig"].length; i++) {
                let data = test_scripts["multisig"][i]["data"];
                data = _.map(data, function (element, index) {
                    if (index === 0) return element;
                    if (index === data.length - 1) return 0;
                    return crypto.Publickey.fromHex(element);
                });

                assert.throws(
                    () => new scripts.MultiSigScript(data),
                    Error,
                    "The number of pubkeys must be equal to n,  " +
                    data.length -
                    2 +
                    "pubkeys provided, while n is " +
                    data[data.length - 1]
                );
            }
        });
    });
    describe("IfElseScript", function () {
        it("can be initialized from an array of arguments", function () {
            for (var i = 0; i < test_scripts["if_else"].length; i++) {
                const if_script = test_scripts["if_else"][i]["if_script"];
                const else_script = test_scripts["if_else"][i]["else_script"];
                const sc = new scripts.IfElseScript([if_script, else_script]);
                assert(sc instanceof scripts.IfElseScript);
                assert.equal(sc.toHex(), test_scripts["if_else"][i]["hex"]);
                assert.equal(sc.type, "if{multisig}else{RelativeTimelock p2pkh}");
            }
        });
        it("throws an error on inconsisent arguments", function () {
            for (var i = 0; i < test_scripts["if_else"].length; i++) {
                const if_script = test_scripts["if_else"][i]["if_script"];
                const else_script = 0;
                assert.throws(
                    () => new scripts.IfElseScript([if_script, else_script]),
                    Error,
                    "Invalid objects to build an If-Else script"
                );
            }
        });
    });
    describe("RelativeTimelockScript", function () {
        it("can be initialized from an array of arguments", function () {
            for (var i = 0; i < test_scripts["relative_timelock"].length; i++) {
                const sc = new scripts.RelativeTimelockScript(
                    test_scripts["relative_timelock"][i]["data"]
                );
                assert(sc instanceof scripts.RelativeTimelockScript);
                assert.equal(sc.toHex(), test_scripts["relative_timelock"][i]["hex"]);
                assert.equal(sc.type, "RelativeTimelock p2pkh");
            }
        });
        it("throws an error on inconsistent arguments", function () {
            for (var i = 0; i < test_scripts["relative_timelock"].length; i++) {
                const locked_script = 0;
                const sequence = 1;
                assert.throws(
                    () => new scripts.RelativeTimelockScript([sequence, locked_script]),
                    Error,
                    "Invalid objects provided to build a RelativeTimelockScript"
                );
            }
        });
    });
    describe("TimelockScript", function () {
        it("can be initialized from an array of arguments", function () {
            for (var i = 0; i < test_scripts['timelock'].length; i++) {
                const sc = new scripts.TimelockScript(test_scripts["timelock"][i]["data"]);
                assert.equal(sc.toHex(), test_scripts["timelock"][i]["hex"]);
                assert.equal(sc.type, "Timelock p2pkh");
            }
        });
        it("throws an error on inconsistent arguments", function () {
            for (var i = 0; i < test_scripts['timelock'].length; i++) {
                const data = test_scripts["timelock"][i]["data"];
                assert.throws(
                    () => new scripts.TimelockScript(data[0], new transaction.Sequence(1)),
                    Error
                );
                assert.throws(
                    () => new scripts.TimelockScript(null, data[1]),
                    Error
                );
            }
        });

    });
});

describe("Keys", function () {
    describe("Privatekey", function () {
        it("can be imported from bip32 format", function () {
            for (var i = 0; i < bip32keys.length; i++) {
                const pk = crypto.Privatekey.fromBip32(bip32keys[i]["priv"]);
                assert(pk instanceof crypto.Privatekey);
                assert.equal(pk.toHex(), bip32keys[i]["hexpriv"]);
            }
        });
        //Test vectors are mainnet random keys so we need to setup the network again
        it("can convert from and to WIF", function () {
            net.setup("mainnet", true);
            for (var i = 0; i < wifkeys.length; i++) {
                const pk = crypto.Privatekey.fromWIF(wifkeys[i]["wif"]);
                assert(pk instanceof crypto.Privatekey);
                assert.equal(pk.toHex(), wifkeys[i]["hex"]);
                assert.equal(pk.toWIF(), wifkeys[i]["wif"]);
            }
            net.setup("testnet", true);
        });
        it("can generate the corresponding public key", function () {
            for (var i = 0; i < bip32keys.length; i++) {
                const prk = crypto.Privatekey.fromBip32(bip32keys[i]["priv"]);
                const puk = prk.getPublic();
                assert(puk instanceof crypto.Publickey);
                assert.equal(
                    bip32keys[i]["hexpub"],
                    puk.compressed.toHex(0, puk.compressed.capacity())
                );
                assert.equal(
                    bip32keys[i]["u_hexpub"],
                    puk.uncompressed.toHex(0, puk.uncompressed.capacity())
                );
            }
        });
        it("can sign a message using ecdsa on secp256k1", function () {
            for (var i = 0; i < signatures.length; i++) {
                const prk = crypto.Privatekey.fromHex(signatures[i]["key"]);
                const sig = prk.signDER(signatures[i]["message"]);
                assert.equal(signatures[i]["signature"], sig);
            }
        });
        it("can verify a message signed using ecdsa on secp256k1", function () {
            for (let i = 0; i < signatures.length; i++) {
                const prk = crypto.Privatekey.fromHex(signatures[i]["key"]);
                const pub = prk.getPublic();
                const valid = pub.verify(signatures[i]["message"], signatures[i]["signature"]);
                assert.equal(valid, true);
            }
        });
    });
    describe("Publickey", function () {
        it("can uncompress a compressed key", function () {
            for (var i = 0; i < bip32keys.length; i++) {
                const compressed = new ByteBuffer.fromHex(bip32keys[i]["hexpub"]);
                const uncompressed = crypto.Publickey.uncompress(compressed);
                assert.equal(uncompressed.toHex(0, uncompressed.capacity()), bip32keys[i]["u_hexpub"]);
            }
        });
        it("can be imported from bip32 format", function () {
            for (var i = 0; i < bip32keys.length; i++) {
                const pub = crypto.Publickey.fromBip32(bip32keys[i]["pub"]);
                assert(pub instanceof crypto.Publickey);
                assert.equal(
                    pub.compressed.toHex(0, pub.compressed.capacity()),
                    bip32keys[i]["hexpub"]
                );
                assert.equal(
                    pub.uncompressed.toHex(0, pub.uncompressed.capacity()),
                    bip32keys[i]["u_hexpub"]
                );
            }
        });
        it("can compute the pubkeyhash", function () {
            for (var i = 0; i < test_scripts["p2pkh"].length; i++) {
                const key = crypto.Publickey.fromHex(test_scripts["p2pkh"][i]["pubkey"]);
                const keyhash = key.hash();
                assert(key instanceof crypto.Publickey);
                assert.equal(
                    keyhash.toHex(0, keyhash.capacity()),
                    test_scripts["p2pkh"][i]["pubkeyhash"]
                );
            }
        });
        it("can compute the corresponding p2pkh address", function () {
            for (var i = 0; i < test_scripts["p2pkh"].length; i++) {
                const key = crypto.Publickey.fromHex(test_scripts["p2pkh"][i]["pubkey"]);
                const addr = key.toAddress();
                assert(addr instanceof address.Address);
                assert.equal(addr.type, "p2pkh");
                assert.equal(
                    addr.hash.toHex(0, addr.hash.capacity()),
                    test_scripts["p2pkh"][i]["pubkeyhash"]
                );
                assert.equal(addr.toBase58(), test_scripts["p2pkh"][i]["address"]);
            }
        });
    });
    describe("HDPrivateKey", function () {
        it("can derive its childs according to bip32", function () {
            let masterpriv, masterpub;
            for (var i = 0; i < hd_keys.length; i++) {
                if (hd_keys[i]["path"] === "m") {
                    masterpriv = new hd.HDPrivateKey(hd_keys[i]["prv"]);
                    masterpub = new hd.HDPublicKey(hd_keys[i]["pub"]);
                    continue;
                }
                assert.equal(
                    masterpriv.derive(hd_keys[i]["path"])._bckey.toString(),
                    hd_keys[i]["prv"]
                );
            }
        });
        it("can generate the corresponding HDPublicKey", function () {
            for (var i = 0; i < hd_keys.length; i++) {
                const priv = new hd.HDPrivateKey(hd_keys[i]["prv"]);
                const pub = priv.getPublic();
                assert(pub instanceof hd.HDPublicKey);
                assert.equal(pub._bckey.toString(), hd_keys[i]["pub"]);
            }
        });
        it("can be generated from a seed", function () {
            net.setup("mainnet", true);
            for (let i = 0; i < hd_keys.length; i++) {
                if (hd_keys[i]["path"] === "m") {
                    const priv = hd.HDPrivateKey.fromSeed(hd_keys[i]["seed"]);
                    assert.equal(priv._bckey.toString(), hd_keys[i]["prv"]);
                    assert.equal(priv.getPublic()._bckey.toString(), hd_keys[i]["pub"]);
                }
            }
            for (let i = 0; i < bip39_seeds.length; i++) {
                const seed = bip39_seeds[i].seed;
                const priv = hd.HDPrivateKey.fromSeed(seed);
                assert.equal(priv._bckey.toString(), bip39_seeds[i].key);
            }

            net.setup("testnet", true);
        });
    });
    describe("HDPublicKey", function () {
        it("can derive its childs according to bip32", function () {
            const paths = [
                "m/0/1/2147483646/2",
                "m/2147483646/0",
                "m/0/2147483647/1/2147483646/2",
                "m/156131385/44645489/4865448/4896853"
            ];
            const masterpriv = new hd.HDPrivateKey(hd_keys[0]["prv"]);
            const masterpub = new hd.HDPublicKey(hd_keys[0]["pub"]);
            _.forEach(paths, path => {
                let newpub = masterpub.derive(path);
                let newpriv = masterpriv.derive(path);

                assert.equal(newpriv.getPublic()._bckey.toString(), newpub._bckey.toString());
            });
        });
    });
    describe("Bip39 Module", function () {
        it("can generate a bip39 seed from a mnemonic sentence", function () {
            for (var i = 0; i < bip39_seeds.length; i++) {
                const mnemonic = bip39_seeds[i].mnemonic;
                const passphrase = bip39_seeds[i].passphrase;
                const seed = bip39.generateSeed(mnemonic, passphrase);
                assert.equal(seed, bip39_seeds[i].seed);
            }
        });
    });
});
