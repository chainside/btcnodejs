/*
Copyright (C) 2017-2018 chainside srl

This file is part of the btcnodejs package.

It is subject to the license terms in the LICENSE.md file found in the top-level
directory of this distribution.

No part of btcnodejs, including this file, may be copied, modified,
propagated, or distributed except according to the terms contained in the
LICENSE.md file.
*/
class HDPrivateKey {
    constructor(obj) {
        if (!obj) {
            throw new TypeError("contructor argument must be either an HDNode or a base58 string");
        } else if (typeof obj === "string") {
            let nw = net.is_mainnet() ? bitcoinjs.networks.bitcoin : bitcoinjs.networks.testnet;

            this._bckey = bitcoinjs.HDNode.fromBase58(obj, nw);
        } else {
            this._bckey = obj;
        }
        this._setParams();
        this.network = net.net_name();
        this.privkey = crypto.Privatekey.fromBip32(this._bckey.toBase58());
    }

    derive(path) {
        if (path.substring(0, 1) === "m" && this._bckey.depth !== 0)
            throw new TypeError("trying to derive a master path from a non master key");
        return new HDPrivateKey(this._bckey.derivePath(path));
    }

    getPublic() {
        return new HDPublicKey(this._bckey.neutered());
    }

    toString() {
        return this._bckey.toBase58();
    }

    static fromSeed(seed) {
        const nw = net.is_mainnet() ? bitcoinjs.networks.bitcoin : bitcoinjs.networks.testnet;
        const key = bitcoinjs.HDNode.fromSeedHex(seed, nw);
        return new HDPrivateKey(key, nw);
    }

    _setParams() {

        this.depth = this._bckey.depth;
        this.chainCode = this._bckey.chainCode;
        this.parentFingerPrint = ByteBuffer.fromHex($.numToHex(this._bckey.parentFingerprint, 16));
        this.fingerPrint = ByteBuffer.fromBinary(this._bckey.getFingerprint());
        this.childIndex = this._bckey.index;
    }
}

class HDPublicKey {
    constructor(obj) {
        if (!obj) {
            throw new TypeError("contructor argument must be either an HDNode or a base58 string");

        } else if (typeof obj === "string") {
            let nw = net.is_mainnet() ? bitcoinjs.networks.bitcoin : bitcoinjs.networks.testnet;
            this._bckey = bitcoinjs.HDNode.fromBase58(obj, nw).neutered();
        } else {
            this._bckey = obj;
        }
        this._setParams();
        this.network = net.net_name();
        this.pubkey = crypto.Publickey.fromBip32(this._bckey.toBase58());
    }

    derive(path) {
        return new HDPublicKey(this._bckey.derivePath(path));
    }

    toString() {
        return this._bckey.toBase58();
    }

    _setParams() {
        this.depth = this._bckey.depth;
        this.chainCode = this._bckey.chainCode;
        this.parentFingerPrint = ByteBuffer.fromHex($.numToHex(this._bckey.parentFingerprint, 16));
        this.fingerPrint = ByteBuffer.fromBinary(this._bckey.getFingerprint());
        this.childIndex = this._bckey.index;
    }
}

module.exports = {
    HDPublicKey,
    HDPrivateKey
};
const bitcoinjs = require("bitcoinjs-lib");
const ByteBuffer = require("bytebuffer");
const _ = require("lodash");
const net = require("./network");
const crypto = require("./crypto");
const $ = require("../tools/conversions");
