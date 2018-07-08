/*
Copyright (C) 2017-2018 chainside srl
Copyright (C) 2018 Davide Gessa (gessadavide@gmail.com)

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
            let network;
            const nw = net.is_mainnet() ? bitcoinjs.networks.bitcoin : bitcoinjs.networks.testnet;
            this._bckey = null;
        } else if (typeof obj === "string") {
            this._bckey = bitcoinjs.HDNode.fromBase58(obj, [bitcoinjs.networks.bitcoin, bitcoinjs.networks.testnet]);
        } else {
            this._bckey = obj;
        }
        this._setParams();
        this.network = net.net_name();
        this.privkey = crypto.Privatekey.fromBip32(this._bckey.toBase58());
    }

    derive(path) {
        if (path.substring(0, 1) === "m" && this._bckey.depth != 0)
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
        /*
        Params are:

        privkey : Privatekey object
        depth : Integer
        fingerPrint : Integer
        parentFingerPrint : Integer
        childIndex : Integer
        chainCode : String
        checksum : Integer
        xprivkey : String
         */
        _.forEach(this._bckey._buffers, (value, prop) => {
            this[prop] = this._bckey.toObject()[prop];
        });
    }
}

class HDPublicKey {
    constructor(obj) {
        if (!obj) {
            let network;
            const nw = net.is_mainnet() ? bitcoinjs.networks.bitcoin : bitcoinjs.networks.testnet;
            this._bckey = new bitcore.HDPublicKey((network = nw));

        } else if (typeof obj === "string") {
            this._bckey = bitcoinjs.HDNode.fromBase58(obj, [bitcoinjs.networks.bitcoin, bitcoinjs.networks.testnet]).neutered();
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
        /*
        Params are:

        pubkey : Privatekey object
        depth : Integer
        fingerPrint : Integer
        parentFingerPrint : Integer
        childIndex : Integer
        chainCode : String
        checksum : Integer
        xpubkey : String
         */
        _.forEach(this._bckey._buffers, (value, prop) => {
            this[prop] = this._bckey.toObject()[prop];
        });
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
