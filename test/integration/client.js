"use strict";
const RpcClient = require("bitcoind-rpc");
const config = require("./config");
const client = new RpcClient(config);
const exec = require("child_process").exec;

function runNodes() {
    return new Promise((resolve, reject) => {
        exec("bitcoind --conf={BASE_PATH}/btcnodejs/test/integration/test_node/bitcoin.conf " +
            "--datadir=/home/doze/Projects/btcnodejs/test/integration/test_node", (err, stdout, stderr) => {
            if (err !== null) reject(err);
            else setTimeout(resolve, 2000);
        });
    });
}

function stopNodes() {
    return new Promise((resolve, reject) => {
        exec("bitcoin-cli --conf={BASE_PATH}/btcnodejs/test/integration/test_node/bitcoin.conf stop", (err, stdout, stderr) => {
            if (err !== null) reject(err);
            else setTimeout(resolve, 2000);
        });
    });
}

function clearNodes() {
    return new Promise((resolve, reject) => {
        exec("rm -r {BASE_PATH}/btcnodejs/test/integration/test_node/regtest", (err, stdout, stderr) => {
            if (err !== null) reject(err);
            else setTimeout(resolve, 2000);
        });
    });
}

function sendRawTransaction(tx_hex) {
    return new Promise((resolve, reject) => {
        client.sendRawTransaction(tx_hex, (err, res) => {
            if (err) reject(err);
            resolve(res.result);
        });
    });

}

function getRawTransaction(txid) {
    return new Promise((resolve, reject) => {
        client.getRawTransaction(txid, 0, (err, res) => {
            if (err) reject(err);
            resolve(res.result);
        });
    });
}

function generateBlocks(number) {
    return new Promise((resolve, reject) => {
        client.generate(number, (err, res) => {
            if (err) reject(err);
            resolve(res.result);
        });
    });
}

function sendToAddress(address, amount) {
    return new Promise((resolve, reject) => {
        client.sendToAddress(address, amount, (err, res) => {
            if (err) reject(err);
            resolve(res.result);
        });
    });
}

module.exports = {
    generateBlocks,
    sendRawTransaction,
    sendToAddress,
    getRawTransaction,
    runNodes,
    stopNodes,
    clearNodes
};

