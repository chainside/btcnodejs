/*
Copyright (C) 2017 chainside srl

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
            const nw = net.is_mainnet() ? bitcore.Networks.mainnet : bitcore.Networks.testnet;
            this._bckey = new bitcore.HDPrivateKey((network = nw));
        } else if (typeof obj === "string") {
            this._bckey = new bitcore.HDPrivateKey(obj);
        } else {
            this._bckey = obj;
        }
        this._setParams();
        this.network = net.net_name();
        this.privkey = crypto.Privatekey.fromBip32(this._bckey.toString());
    }

    derive(path) {
        if (path.substring(0, 1) === "m" && this.depth != 0)
            throw new TypeError("trying to derive a master path from a non master key");
        return new HDPrivateKey(this._bckey.deriveChild(path));
    }

    getPublic() {
        return new HDPublicKey(this._bckey.hdPublicKey.toString());
    }

    static fromSeed(seed) {
        const nw = net.is_mainnet() ? bitcore.Networks.mainnet : bitcore.Networks.testnet;
        const key = bitcore.HDPrivateKey.fromSeed(seed, nw);
        return new HDPrivateKey(key);
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
            const nw = net.is_mainnet() ? bitcore.Networks.mainnet : bitcore.Networks.testnet;
            this._bckey = new bitcore.HDPublicKey((network = nw));

        } else if (typeof obj === "string") {
            this._bckey = new bitcore.HDPublicKey(obj);

        } else {
            this._bckey = obj;
        }
        this._setParams();
        this.network = net.net_name();
        this.pubkey = crypto.Publickey.fromBip32(this._bckey.toString());
    }

    derive(path) {
        return new HDPublicKey(this._bckey.deriveChild(path));
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
const bitcore = require("bitcore-lib");
const ByteBuffer = require("bytebuffer");
const _ = require("lodash");
const net = require("./network");
const crypto = require("./crypto");
