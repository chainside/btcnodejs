const scripts = require("../lib/scripts");
const crypto = require("../lib/crypto");
module.exports = {
    txs_data: [
        {
            unsigned_tx:
            "0100000002fff7f7881a8099afa6940d42d1e7f6362bec38171ea3edf433541db4e4ad969f" +
            "0000000000eeffffffef51e1b804cc89d182d279655c3aa89e815b1b309fe287d9b2b55d57" +
            "b90ec68a0100000000ffffffff02202cb206000000001976a9148280b37df378db99f66f85" +
            "c95a783a76ac7a6d5988ac9093510d000000001976a9143bde42dbee7e4dbe6a21b2d50ce2" +
            "f0167faa815988ac11000000",
            hash_prevouts: "96b827c8483d4e9b96712b6713a7b68d6e8003a781feba36c31143470b4efd37",
            hash_sequence: "52b0a642eea2fb7ae638c36f6252b6750293dbe574a806984b8e4d8548339a3b",
            hash_outputs: "863ef3e1a92afbfdb97f31ad0fc7683ee943e9abcf2501590ff8f6551f47e5e5",
            hash_preimage:
            "0100000096b827c8483d4e9b96712b6713a7b68d6e8003a781feba36c31143470b4efd37" +
            "52b0a642eea2fb7ae638c36f6252b6750293dbe574a806984b8e4d8548339a3bef51e1b8" +
            "04cc89d182d279655c3aa89e815b1b309fe287d9b2b55d57b90ec68a010000001976a914" +
            "1d0f172a0ecb48aee1be1f2687d2963ae33f71a188ac0046c32300000000ffffffff863e" +
            "f3e1a92afbfdb97f31ad0fc7683ee943e9abcf2501590ff8f6551f47e5e5110000000100" +
            "0000",
            sighash: "c37af31116d1b27caf68aae9e3ac82f1477929014d5b917657d0eb49478cb670",
            signature:
            "304402203609e17b84f6a7d30c80bfa610b5b4542f32a8a0d5447a12fb1366d7f01cc44a02205" +
            "73a954c4518331561406f90300e8f3358f51928d43c212a8caed02de67eebee",
            txins: [
                {
                    prev_script: scripts.P2pkhScript.fromHex(
                        "2103c9f4836b9a4f77fc0d81f7bcb01b7f1b35916864b9476c241ce9fc198bd25432ac"
                    ),
                    prev_amount: 625000000
                },
                {
                    prev_script: scripts.P2wpkhV0Script.fromHex(
                        "00141d0f172a0ecb48aee1be1f2687d2963ae33f71a1"
                    ),
                    prev_amount: 600000000,
                    digest_preimage:
                    "0100000096b827c8483d4e9b96712b6713a7b68d6e8003a781feba36c31" +
                    "143470b4efd3752b0a642eea2fb7ae638c36f6252b6750293dbe574a806" +
                    "984b8e4d8548339a3bef51e1b804cc89d182d279655c3aa89e815b1b309" +
                    "fe287d9b2b55d57b90ec68a010000001976a9141d0f172a0ecb48aee1be" +
                    "1f2687d2963ae33f71a188ac0046c32300000000ffffffff863ef3e1a92" +
                    "afbfdb97f31ad0fc7683ee943e9abcf2501590ff8f6551f47e5e5110000" +
                    "0001000000",
                    digest: "c37af31116d1b27caf68aae9e3ac82f1477929014d5b917657d0eb49478cb670",
                    privk: crypto.Privatekey.fromHex(
                        "619c335025c7f4012e556c2a58b2506e30b8511b53ade95e" + "a316fd8c3286feb9"
                    )
                }
            ],
            txid: "3335ffae0df20c5407e8de12b49405c8e912371f00fe4132bfaf95ad49c40243"
        },
        {
            unsigned_tx:
            "0100000001db6b1b20aa0fd7b23880be2ecbd4a98130974cf4748fb66092ac4d3ceb1a5477" +
            "0100000000feffffff02b8b4eb0b000000001976a914a457b684d7f0d539a46a45bbc043f3" +
            "5b59d0d96388ac0008af2f000000001976a914fd270b1ee6abcaea97fea7ad0402e8bd8ad6" +
            "d77c88ac92040000",
            hash_prevouts: "b0287b4a252ac05af83d2dcef00ba313af78a3e9c329afa216eb3aa2a7b4613a",
            hash_sequence: "18606b350cd8bf565266bc352f0caddcf01e8fa789dd8a15386327cf8cabe198",
            hash_outputs: "de984f44532e2173ca0d64314fcefe6d30da6f8cf27bafa706da61df8a226c83",
            hash_preimage:
            "01000000b0287b4a252ac05af83d2dcef00ba313af78a3e9c329afa216eb3aa2a7b4613a" +
            "18606b350cd8bf565266bc352f0caddcf01e8fa789dd8a15386327cf8cabe198db6b1b20" +
            "aa0fd7b23880be2ecbd4a98130974cf4748fb66092ac4d3ceb1a5477010000001976a914" +
            "79091972186c449eb1ded22b78e40d009bdf008988ac00ca9a3b00000000feffffffde98" +
            "4f44532e2173ca0d64314fcefe6d30da6f8cf27bafa706da61df8a226c83920400000100" +
            "0000",
            sighash: "64f3b0f4dd2bb3aa1ce8566d220cc74dda9df97d8490cc81d89d735c92e59fb6",
            signature:
            "3044022047ac8e878352d3ebbde1c94ce3a10d057c24175747116f8288e5d794d12d482f0220" +
            "217f36a485cae903c713331d877c1f64677e3622ad4010726870540656fe9dcb",
            txins: [
                {
                    prev_script: scripts.P2wpkhV0Script.fromHex(
                        "001479091972186c449eb1ded22b78e40d009bdf0089"
                    ),
                    prev_amount: 1000000000,
                    digest_preimage:
                    "01000000b0287b4a252ac05af83d2dcef00ba313af78a3e9c329afa216e" +
                    "b3aa2a7b4613a18606b350cd8bf565266bc352f0caddcf01e8fa789dd8a" +
                    "15386327cf8cabe198db6b1b20aa0fd7b23880be2ecbd4a98130974cf47" +
                    "48fb66092ac4d3ceb1a5477010000001976a91479091972186c449eb1de" +
                    "d22b78e40d009bdf008988ac00ca9a3b00000000feffffffde984f44532" +
                    "e2173ca0d64314fcefe6d30da6f8cf27bafa706da61df8a226c83920400" +
                    "0001000000",
                    digest: "64f3b0f4dd2bb3aa1ce8566d220cc74dda9df97d8490cc81d89d735c92e59fb6",
                    privk: crypto.Privatekey.fromHex(
                        "eb696a065ef48a2192da5b28b694f87544b30fae8327c451" + "0137a922f32c6dcf"
                    )
                }
            ],
            txid: "321a59707939041eeb0d524f34432c0c46ca3920f0964e6c23697581f176b6c0"
        }
    ],
    addresses: {
        p2wpkh: [
            {
                bech32: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
                hash: "751e76e8199196d454941c45d1b3a323f1433bd6"
            }
        ],
        p2wsh: [
            {
                bech32: "tb1qqqqqp399et2xygdj5xreqhjjvcmzhxw4aywxecjdzew6hylgvsesrxh6hy",
                hash: "000000c4a5cad46221b2a187905e5266362b99d5e91c6ce24d165dab93e86433"
            },
            {
                bech32: "tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sl5k7",
                hash: "1863143c14c5166804bd19203356da136c985678cd4d27a1b8c6329604903262"
            }
        ]
    }
};
