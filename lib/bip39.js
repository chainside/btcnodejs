"use strict";


const ENTROPY_SIZE_ERROR = "Entropy Size must be between 16 and 32 bytes and a multiple of 4";


function zeroPadding(string, n) {
    while (string.length < n) {
        string = "0" + string;
    }
    return string;
}

function calculateChecksumBits(entropy) {
    var sha_256 = shajs("sha256").update(entropy, "hex").digest("hex");

    var entropy_sha256 = $.hexToBinary(sha_256);
    var checksum_bits = entropy_sha256.substring(0, entropy_bits.length / 32);
    return checksum_bits;
}

/**
 *
 * @param entropySize Int, size of the initial entropy (in bytes)
 * @returns {Array} Array of strings representing the mnemonic sentence
 */


function generateMnemonic(entropySize) {

    if (entropySize < MIN_ENTROPY_SIZE || entropySize > MAX_ENTROPY_SIZE) {
        throw(ENTROPY_SIZE_ERROR);
    }
    if (entropySize % 4 !== 0) {
        throw ENTROPY_SIZE_ERROR;
    }
    var entropy = crypto.randomBytes(entropySize).toString("hex");

    var entropy_bits = $.hexToBinary(entropy);

    var checksum_bits = calculateChecksumBits(entropy);
    var entropy_cs = entropy_bits + checksum_bits;
    var chunks = entropy_cs.match(/(.{1,11})/g);
    var mnemonic = _.map(chunks, chunk => words[parseInt(chunk, 2)]);
    return mnemonic;

}

/**
 *
 * @param mnemonic Array of strings representing a bip39 mnemonic sentence
 * @param passphrase String passphrase (defaults to "")
 */
function generateSeed(mnemonic, passphrase = "") {
    var salt = Buffer.from("mnemonic" + passphrase, "utf-8");
    var password = Buffer.from(mnemonic.join(" "), "utf-8");
    var seed = crypto.pbkdf2Sync(password, salt, 2048, 64, "sha512");
    return seed.toString("hex");
}

function validateMnemonic(mnemonic) {
    var indexes = _.map(mnemonic, word => words.indexOf(word));
    var chunks = _.map(indexes, index => zeroPadding(index.toString(2), 11));

    var entropy_cs = chunks.join("");
    var checksum_length = mnemonic.length / 3;

    var entropy_bits = entropy_cs.substring(0, entropy_cs.length - checksum_length);
    var checksum_bits = entropy_cs.substring(entropy_bits.length, entropy_cs.length);

    var entropy = Buffer.from(_.map(entropy_bits.match(/(.{1,8})/g), bin => parseInt(bin, 2))).toString("hex");

    var entropy_checksum = calculateChecksumBits(entropy);

    return entropy_checksum === checksum_bits;

}

const crypto = require("crypto");
const shajs = require("sha.js");
const $ = require("../tools/conversions");
const words = require("./bip39wordlists/en_wordlist").words;
const _ = require("lodash");
const MAX_ENTROPY_SIZE = 32;
const MIN_ENTROPY_SIZE = 16;

module.exports = {
    generateSeed,
    generateMnemonic,
    validateMnemonic
};
