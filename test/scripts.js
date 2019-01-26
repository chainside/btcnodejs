const transaction = require("../lib/transaction");
const scripts = require("../lib/scripts");
const crypto = require("../lib/crypto");
module.exports = {
    spk: {
        p2pk: [
            {
                hex: "4104ea0d6650c8305f1213a89c65fc8f4343a5dac8e985c869e51d3aa02879b57c60cff49fcb99314d02dfc612d654e4333150ef61fa569c1c66415602cae387baf7ac",
                pubkey: "04ea0d6650c8305f1213a89c65fc8f4343a5dac8e985c869e51d3aa02879b57c60cff49fcb99314d02dfc612d654e4333150ef61fa569c1c66415602cae387baf7",
                p2shHash: "45f76843096c76fa9f80ad4f33bf6eae2772a8c0",
                keytype: "uncompressed"
            },
            {
                hex: "2103ea0d6650c8305f1213a89c65fc8f4343a5dac8e985c869e51d3aa02879b57c60ac",
                pubkey: "03ea0d6650c8305f1213a89c65fc8f4343a5dac8e985c869e51d3aa02879b57c60",
                p2shHash: "3fb94b381c0409f4f54e27b7b160cb8a8f951122",
                keytype: "compressed"
            },


        ],
        p2pkh: [
            {
                hex: "76a9148b4912ec0496b5f759f3af5ab24d6f4779a52f9e88ac",
                pubkey: "026263992eda6538202047f1514e0f6155a229c3d61b066807664e9ef73d406d95",
                pubkeyhash: "8b4912ec0496b5f759f3af5ab24d6f4779a52f9e",
                address: "mtDRkyy3a65oNhATimSQFhRqU511buvVAT",
                p2shHash: "029c09b86e1e4c3822bc71859af3300520d577c2"
            }
        ],
        p2sh: [
            {
                hex: "a914ed4a0e1af5316666499ec6f8a5a99bf4abaf754987",
                scripthash: "ed4a0e1af5316666499ec6f8a5a99bf4abaf7549",
                address: "2NEstrBkkLcEmXCrUxStQnY9dP9PRoHNmNk"
            }
        ],
        multisig: [
            {
                hex:
                "522102c08786d63f78bd0a6777ffe9c978cf5899756cfc32bfad09a89e211aeb92624221033e81519ecf373ea3a5c7e1c" +
                "051b71a898fb3438c9550e274d980f147eb4d069d21036d568125a969dc78b963b494fa7ed5f20ee9c2f2fc2c57f86c5d" +
                "f63089f2ed3a53ae",
                data: [
                    2,
                    "02c08786d63f78bd0a6777ffe9c978cf5899756cfc32bfad09a89e211aeb926242",
                    "033e81519ecf373ea3a5c7e1c051b71a898fb3438c9550e274d980f147eb4d069d",
                    "036d568125a969dc78b963b494fa7ed5f20ee9c2f2fc2c57f86c5df63089f2ed3a",
                    3
                ],
                p2shHash: "45cbbfbc9d78d3d26e464972e1ed0640e57baabc"
            }
        ],
        if_else: [
            {
                hex:
                "63522102c08786d63f78bd0a6777ffe9c978cf5899756cfc32bfad09a89e211aeb92624221033e81519ecf373ea3a5c7e1c" +
                "051b71a898fb3438c9550e274d980f147eb4d069d21036d568125a969dc78b963b494fa7ed5f20ee9c2f2fc2c57f86c5df6" +
                "3089f2ed3a53ae6755b27576a914f89873b36ea31cfbf4d2081db73147078460c61188ac68",
                if_script: new scripts.MultiSigScript([
                    2,
                    crypto.Publickey.fromHex(
                        "02c08786d63f78bd0a6777ffe9c978cf5899756cfc32bfad09a89e211aeb926242"
                    ),
                    crypto.Publickey.fromHex(
                        "033e81519ecf373ea3a5c7e1c051b71a898fb3438c9550e274d980f147eb4d069d"
                    ),
                    crypto.Publickey.fromHex(
                        "036d568125a969dc78b963b494fa7ed5f20ee9c2f2fc2c57f86c5df63089f2ed3a"
                    ),
                    3
                ]),
                else_script: new scripts.RelativeTimelockScript([
                    new scripts.P2pkhScript(
                        crypto.Publickey.fromHex(
                            "02c08786d63f78bd0a6777ffe9c978cf5899756cfc32bfad09a89e211aeb926242"
                        )
                    ),
                    new transaction.Sequence(5)
                ]),
                p2shHash: "b6ec775b130018247aa62797865071c354cc86eb"
            }
        ],
        relative_timelock: [
            {
                hex: "55b27576a914f89873b36ea31cfbf4d2081db73147078460c61188ac",
                data: [
                    new scripts.P2pkhScript(
                        crypto.Publickey.fromHex(
                            "02c08786d63f78bd0a6777ffe9c978cf5899756cfc32bfad09a89e211aeb926242"
                        )
                    ),
                    new transaction.Sequence(5)
                ],
                p2shHash: "a7553c4129f920da43f9621a62c98c1833d54be2"
            }
        ],
        timelock: [
            {
                hex: "55b17576a914f89873b36ea31cfbf4d2081db73147078460c61188ac",
                data: [
                    new scripts.P2pkhScript(crypto.Publickey.fromHex(
                        "02c08786d63f78bd0a6777ffe9c978cf5899756cfc32bfad09a89e211aeb926242"
                    )),
                    new transaction.Locktime(5)
                ],
                p2shHash: "e26f9ff6cc394c24689a2a6b8f9501ff4f80bfc6"
            }
        ],
        p2wpkh: [
            {
                hex: "0014f81b6a6cfaaf19dbd9e56b9cab2d8a457608ad8e",
                hash: "4d09a2ea331cf46887c00a82122d4cc288a77c4480acf474073c178428efd3d4",
                type: "p2wpkhv0",
                address: "tb1qlqdk5m864uvahk09dww2ktv2g4mq3tvwl8wkcz"
            }
        ],
        p2wsh: [
            {
                hex: "0020cdbf909e935c855d3e8d1b61aeb9c5e3c03ae8021b286839b1a72f2e48fdba70",
                hash: "bec02ca04c990083b099f9e9d2a90e9498025f5061cfb3e3b3077aa4b60a484f",
                type: "p2wshv0",
                address: "tb1qeklep85ntjz4605drds6aww9u0qr46qzrv5xswd35uhjuj8ahfcqlpvc8e"
            }
        ]
    },
    sigs: [
        {
            asm:
            "3045022100b7bf286e5f6ac6fa308e8876a8a59b289094851a26cf62c20abd174917eb7762022069b5269e584e4c76" +
            "f207d1b789bff7171a663d795e49751c12cf07dceb2a94c701 024a0dcb0527c2751ea4dda3aa98f6eface16e978db" +
            "a8062bcbed623f158c07691",
            hex:
            "483045022100b7bf286e5f6ac6fa308e8876a8a59b289094851a26cf62c20abd174917eb7762022069b5269e584e4c7" +
            "6f207d1b789bff7171a663d795e49751c12cf07dceb2a94c70121024a0dcb0527c2751ea4dda3aa98f6eface16e978d" +
            "ba8062bcbed623f158c07691",
            witness_hex:
            "02483045022100b7bf286e5f6ac6fa308e8876a8a59b289094851a26cf62c20abd174917eb7762022069b5269e584e4" +
            "c76f207d1b789bff7171a663d795e49751c12cf07dceb2a94c70121024a0dcb0527c2751ea4dda3aa98f6eface16e97" +
            "8dba8062bcbed623f158c07691"
        },
        {
            asm:
            "3045022100af246c27890c2bc07a0b7450d3d82509702a44a4defdff766355240b114ee2ac02207bb67b468452fa1b3" +
            "25dd5583879f5c1412e0bb4dae1c2c96c7a408796ab76f101 02ab9e8575536a1e99604a158fc60fe2ebd1cb1839e91" +
            "9b4ca42b8d050cfad71b2",
            hex:
            "483045022100af246c27890c2bc07a0b7450d3d82509702a44a4defdff766355240b114ee2ac02207bb67b468452fa1" +
            "b325dd5583879f5c1412e0bb4dae1c2c96c7a408796ab76f1012102ab9e8575536a1e99604a158fc60fe2ebd1cb1839" +
            "e919b4ca42b8d050cfad71b2",
            witness_hex:
            "02483045022100af246c27890c2bc07a0b7450d3d82509702a44a4defdff766355240b114ee2ac02207bb67b468452f" +
            "a1b325dd5583879f5c1412e0bb4dae1c2c96c7a408796ab76f1012102ab9e8575536a1e99604a158fc60fe2ebd1cb18" +
            "39e919b4ca42b8d050cfad71b2"
        },
        {
            asm:
            "304502210092a204c35e27ded55012b28b8f88192058d29fd8c455442eca025f74cb6a51a3022016b1b98397b6c1387" +
            "126732c66300e75680d0896b64dcf4a6835f72435b0035001 02a32cf30511795881f432b38883a5793d00828430226" +
            "d379d43ae2dbb603a8c9b",
            hex:
            "48304502210092a204c35e27ded55012b28b8f88192058d29fd8c455442eca025f74cb6a51a3022016b1b98397b6c13" +
            "87126732c66300e75680d0896b64dcf4a6835f72435b00350012102a32cf30511795881f432b38883a5793d00828430" +
            "226d379d43ae2dbb603a8c9b",
            witness_hex:
            "0248304502210092a204c35e27ded55012b28b8f88192058d29fd8c455442eca025f74cb6a51a3022016b1b98397b6c" +
            "1387126732c66300e75680d0896b64dcf4a6835f72435b00350012102a32cf30511795881f432b38883a5793d008284" +
            "30226d379d43ae2dbb603a8c9b"
        },
        {
            asm:
            "3045022100f3ecd6482fc71de2f84f876eea8ac8be4f9cf92f885f14e97283c46d97c7566302206ec0f71137c8ff101b" +
            "2437441924726af39ff1db68f17238b4835c5214d5ad0d01 036451829b5a49f4909500ce18c4500bf16f9c4dd49c1be" +
            "2e9c74d210a134514d7",
            hex:
            "483045022100f3ecd6482fc71de2f84f876eea8ac8be4f9cf92f885f14e97283c46d97c7566302206ec0f71137c8ff10" +
            "1b2437441924726af39ff1db68f17238b4835c5214d5ad0d0121036451829b5a49f4909500ce18c4500bf16f9c4dd49c" +
            "1be2e9c74d210a134514d7",
            witness_hex:
            "02483045022100f3ecd6482fc71de2f84f876eea8ac8be4f9cf92f885f14e97283c46d97c7566302206ec0f71137c8ff" +
            "101b2437441924726af39ff1db68f17238b4835c5214d5ad0d0121036451829b5a49f4909500ce18c4500bf16f9c4dd4" +
            "9c1be2e9c74d210a134514d7"
        }
    ],
    compile: {
        p2sh: {
            hex: "a914ed4a0e1af5316666499ec6f8a5a99bf4abaf754987",
            asm: "OP_HASH160 ed4a0e1af5316666499ec6f8a5a99bf4abaf7549 OP_EQUAL",
            code: "P2shScript(bytearray(unhexlify(\"ed4a0e1af5316666499ec6f8a5a99bf4abaf7549\")))",
            type: "p2sh"
        },
        p2pkh: {
            hex: "76a914df76c017354ac39bde796abe4294d31de8b5788a88ac",
            asm: "OP_DUP OP_HASH160 df76c017354ac39bde796abe4294d31de8b5788a OP_EQUALVERIFY OP_CHECKSIG",
            code: "P2pkhScript(bytearray(unhexlify(\"df76c017354ac39bde796abe4294d31de8b5788a\")))",
            type: "p2pkh"
        },
        p2pk: {
            hex: "4104ea0d6650c8305f1213a89c65fc8f4343a5dac8e985c869e51d3aa02879b57c60cff49fcb99314d02dfc612d654e4333150ef61fa569c1c66415602cae387baf7ac",
            asm: "04ea0d6650c8305f1213a89c65fc8f4343a5dac8e985c869e51d3aa02879b57c60cff49fcb99314d02dfc612d654e4333150ef61fa569c1c66415602cae387baf7 OP_CHECKSIG",
            code: "P2pkScript(PublicKey.unhexlify(\"04ea0d6650c8305f1213a89c65fc8f4343a5dac8e985c869e51d3aa02879b57c60cff49fcb99314d02dfc612d654e4333150ef61fa569c1c66415602cae387baf7\"))",
            type: "p2pk"
        },
        if_else_timelock: {
            hex: "6352210384478d41e71dc6c3f9edde0f928a47d1b724c05984ebfb4e7d0422e80abe95ff2103eb27fa93667e4f48e36071eb21c7229e5416ff0abd2886d59c8f314fb3cbee4052ae67037b9710b175210384478d41e71dc6c3f9edde0f928a47d1b724c05984ebfb4e7d0422e80abe95ffac68",
            asm: "OP_IF OP_2 0384478d41e71dc6c3f9edde0f928a47d1b724c05984ebfb4e7d0422e80abe95ff 03eb27fa93667e4f48e36071eb21c7229e5416ff0abd2886d59c8f314fb3cbee40 OP_2 OP_CHECKMULTISIG OP_ELSE 7b9710 OP_CHECKLOCKTIMEVERIFY OP_DROP 0384478d41e71dc6c3f9edde0f928a47d1b724c05984ebfb4e7d0422e80abe95ff OP_CHECKSIG OP_ENDIF",
            code: "IfElseScript(MultisigScript(2, PublicKey.unhexlify(\"0384478d41e71dc6c3f9edde0f928a47d1b724c05984ebfb4e7d0422e80abe95ff\"), PublicKey.unhexlify(\"03eb27fa93667e4f48e36071eb21c7229e5416ff0abd2886d59c8f314fb3cbee40\"), 2), AbsoluteTimelockScript(Locktime(1087355), P2pkScript(PublicKey.unhexlify(\"0384478d41e71dc6c3f9edde0f928a47d1b724c05984ebfb4e7d0422e80abe95ff\"))))",
            type: "if{ multisig }else{ [timelock] p2pk }"
        },
        relativetimelock: {
            hex: "635221021b98b2e4ba9dae9f869bcf948c45df6b6f8e6bb623915cf144237f5e6ab98cf4210376d53363bbeefed905fc685e4d4e1fe0cbf9959e8f59e9f5f209f489b3a6285752ae6755b275210301bf316386b5b09abe8f71cc68bf7ab62bc9f511b7c13fe0febd75e3ac5ce855ac68",
            asm: "OP_IF OP_2 021b98b2e4ba9dae9f869bcf948c45df6b6f8e6bb623915cf144237f5e6ab98cf4 0376d53363bbeefed905fc685e4d4e1fe0cbf9959e8f59e9f5f209f489b3a62857 OP_2 OP_CHECKMULTISIG OP_ELSE OP_5 OP_CHECKSEQUENCEVERIFY OP_DROP 0301bf316386b5b09abe8f71cc68bf7ab62bc9f511b7c13fe0febd75e3ac5ce855 OP_CHECKSIG OP_ENDIF",
            code: "IfElseScript(MultisigScript(2, PublicKey.unhexlify(\"021b98b2e4ba9dae9f869bcf948c45df6b6f8e6bb623915cf144237f5e6ab98cf4\"), PublicKey.unhexlify(\"0376d53363bbeefed905fc685e4d4e1fe0cbf9959e8f59e9f5f209f489b3a62857\"), 2),RelativeTimelockScript(Sequence(5), P2pkScript(PublicKey.unhexlify(\"0301bf316386b5b09abe8f71cc68bf7ab62bc9f511b7c13fe0febd75e3ac5ce855\"))))",
            type: "if{ multisig }else{ [relativetimelock] p2pk }"
        },
        multisig: {
            hex: "522102c08786d63f78bd0a6777ffe9c978cf5899756cfc32bfad09a89e211aeb92624221033e81519ecf373ea3a5c7e1c051b71a898fb3438c9550e274d980f147eb4d069d21036d568125a969dc78b963b494fa7ed5f20ee9c2f2fc2c57f86c5df63089f2ed3a53ae",
            asm: "OP_2 02c08786d63f78bd0a6777ffe9c978cf5899756cfc32bfad09a89e211aeb926242 033e81519ecf373ea3a5c7e1c051b71a898fb3438c9550e274d980f147eb4d069d 036d568125a969dc78b963b494fa7ed5f20ee9c2f2fc2c57f86c5df63089f2ed3a OP_3 OP_CHECKMULTISIG",
            code: "MultisigScript(2, PublicKey.unhexlify(\"02c08786d63f78bd0a6777ffe9c978cf5899756cfc32bfad09a89e211aeb926242\"), PublicKey.unhexlify(\"033e81519ecf373ea3a5c7e1c051b71a898fb3438c9550e274d980f147eb4d069d\"), PublicKey.unhexlify(\"036d568125a969dc78b963b494fa7ed5f20ee9c2f2fc2c57f86c5df63089f2ed3a\"), 3)",
            type: "multisig"
        },
        nulldata: {
            hex: "6a28444f4350524f4f463832bd18ceb0a7861f2a8198013047a3fb861261523c0fc4164abc044e517702",
            asm: "OP_RETURN 444f4350524f4f463832bd18ceb0a7861f2a8198013047a3fb861261523c0fc4164abc044e517702",
            code: "NulldataScript(StackData.unhexlify(\"444f4350524f4f463832bd18ceb0a7861f2a8198013047a3fb861261523c0fc4164abc044e517702\"))",
            type: "nulldata"
        },
        p2wpkh: {
            hex: "0014f81b6a6cfaaf19dbd9e56b9cab2d8a457608ad8e",
            asm: "OP_0 f81b6a6cfaaf19dbd9e56b9cab2d8a457608ad8e",
            code: "P2wpkhV0Script(bytearray(unhexlify(\"f81b6a6cfaaf19dbd9e56b9cab2d8a457608ad8e\")))",
            type: "p2wpkhv0"
        },
        p2wsh: {
            hex: "0020cdbf909e935c855d3e8d1b61aeb9c5e3c03ae8021b286839b1a72f2e48fdba70",
            asm: "OP_0 cdbf909e935c855d3e8d1b61aeb9c5e3c03ae8021b286839b1a72f2e48fdba70",
            code: "P2wshV0Script(bytearray(unhexlify(\"cdbf909e935c855d3e8d1b61aeb9c5e3c03ae8021b286839b1a72f2e48fdba70\")))",
            type: "p2wshv0"
        }
    }
};
