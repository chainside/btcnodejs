const scripts = require("../lib/scripts");

module.exports = {
    digests: [
        {
            unsigned_tx:
            "02000000019379fdc32c4c9d4f14cf43bf89a4e64365e4e713e19d7154989f84b" +
            "8d42bbb650100000000ffffffff0180f0fa02000000001976a914fec8ecfbb43b" +
            "e3b0ed143feafe8a79860ac512b288ac00000000",
            txins: [
                {
                    prev_script: scripts.P2pkhScript.fromHex(
                        "76a914534f5b2c28ac08363dab4d4dfd937e36810b05dd88ac"
                    ),
                    digest_preimage:
                    "02000000019379fdc32c4c9d4f14cf43bf89a4e64365e4e713e19d7154989" +
                    "f84b8d42bbb65010000001976a914534f5b2c28ac08363dab4d4dfd937e36" +
                    "810b05dd88acffffffff0180f0fa02000000001976a914fec8ecfbb43be3b" +
                    "0ed143feafe8a79860ac512b288ac0000000001000000",
                    digest: "666493e1386741fa42db54a3968a51b6243b1edd1a980b617d8fbce296132cd0",
                    priv_wif: "cPXc7uzzsS5GKmRx7c6AMkwBWmj3LTPNAEeyrARLbVBaqXrrRLBK"
                }
            ]
        },
        {
            unsigned_tx:
            "02000000018eb50f296c02578b3908584faefc739da78579c3667e43a80233abd4" +
            "d3454e4f0000000000ffffffff01002d3101000000001976a914534f5b2c28ac08" +
            "363dab4d4dfd937e36810b05dd88ac00000000",
            txins: [
                {
                    prev_script: scripts.P2pkhScript.fromHex(
                        "76a914fec8ecfbb43be3b0ed143feafe8a79860ac512b288ac"
                    ),
                    digest_preimage:
                    "02000000018eb50f296c02578b3908584faefc739da78579c3667e43a8023" +
                    "3abd4d3454e4f000000001976a914fec8ecfbb43be3b0ed143feafe8a7986" +
                    "0ac512b288acffffffff01002d3101000000001976a914534f5b2c28ac083" +
                    "63dab4d4dfd937e36810b05dd88ac0000000001000000",
                    digest: "9e8b4eb4adad1c8ff31679150a092cfdb9ddec068a2e1c616cacea8f5944170e",
                    priv_wif: "cW3YGYL49CpzxjrnZz1jUuEnaAuG4hEgU7oHQTKBNsqcZ584jVmF"
                }
            ]
        }
    ],
    signatures: [
        {
            key: "b1060bed3ce69fbc7f15c129c70c98fdc19885d042883b2601a53d6b90786a56",
            message: "aabbcc",
            signature:
            "30440220057dc4d850be7815d672b02b138de2c9e1ed71e165f2063400f3aa67ed50" +
            "ad5102206d8b4bf06ba9a4282f960443a1c041950579dc9f279560f2c566c479be6f" +
            "9a9a"
        },
        {
            key: "b1060bed3ce69fbc7f15c129c70c98fdc19885d042883b2601a53d6b90786a56",
            message: "0ab1ce148c65faff0019",
            signature:
            "3045022100c2337de29df19f69f5707c87916aa473467aa67645265ee62f8fb04e8c" +
            "ac60ad02205f2fbb1104bf604f250893b62543416b5d9d261aadd1869a38029c6ccd" +
            "806377"
        },
        {
            key: "b1060bed3ce69fbc7f15c129c70c98fdc19885d042883b2601a53d6b90786a56",
            message: "c37af31116d1b27caf68aae9e3ac82f1477929014d5b917657d0eb49478cb670",
            signature:
            "3044022022313b172c5249a3b054712e1edcc41d094779982ef406d66685a5fbebe3c" +
            "5e802202e94281fcd73f121c98a908b53e5515417949afcb23f1d48b2a28263a1ee53" +
            "14"
        },
        {
            key: "566bc51059b577de9c32bba4d5b3cba715f155ce870e01b5409f89ef5a5f70ff",
            message: "64f3b0f4dd2bb3aa1ce8566d220cc74dda9df97d8490cc81d89d735c92e59fb6",
            signature:
            "3044022002828d6eca86405888f00434af1958eb3883a7048c47dac78977ea666c651" +
            "b27022015cf5d763c8dea65e68ddc4a2c82076ca8be19ff4ce6874c9cfa927ec87585" +
            "99"
        },
        {
            key: "566bc51059b577de9c32bba4d5b3cba715f155ce870e01b5409f89ef5a5f70ff",
            message: "a4f3b0f4652bb32d1cefa56d320cc74d7a9dff7d8490ccd1d896c35c92e59fb6",
            signature:
            "3045022100e159f775573c8d02d2acc3449bf64b504b81b8d06a94f6d342ec1085627a" +
            "63e70220235395623f203132e2ce36e8ea91afd7ee283c5d7d38efb8be03558f51aaf3" +
            "60"
        }
    ]
};
