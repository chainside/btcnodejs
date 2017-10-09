# btcnodejs

`btcnodejs` is a Segwit-compliant bitcoin library which provides tools for managing bitcoin data structures. It is the NodeJS version of [btcpy](https://github.com/chainside/btcpy).

**This library is a work in progress and its usage in a production environment is highly discouraged. Also, as long as the version is 0.\*, API breaking changes might occur**

Some of the functionalities are a wrapping around  [bitcore-lib](https://github.com/bitpay/bitcore-lib) and  [bitcoinjs-lib](https://github.com/bitcoinjs/bitcoinjs-lib), and their development is still in progress.

It makes usage of [bytebuffer.js](https://github.com/dcodeIO/bytebuffer.js) for representing most of the data structures

Table of Contents
=================
* [Installation](#installation)
* [Usage](#usage)
* [Browserify](#browserify)
* [API](#api)
  * [Transactions](#transactions)
  * [Scripts](#scripts)
  * [Solvers](#solvers)
  * [Crypto](#crypto)
  * [HD](#hd)
  * [Address](#address)
  * [Block](#block)

# Installation

To install the library, run `npm install btcnodejs`

# Browserify

This library can be used in the browser with [browserify](https://github.com/browserify/browserify). If you are familiar with browserify, you can skip this.

Assuming the entry point of the project is a file main.js like:

```javascript
const btcnodejs = require("btcnodejs");
const net = btcnodejs.network;
net.setup("testnet");
var k = new btcnodejs.HDPrivateKey();
console.log(k.privkey.toWIF());
```

Go into the main.js folder and run:

```
browserify main.js > browser_main.js

```

Now you can load the 'browserified' main.js into your html:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Example Browserify</title>
    </head>
  <body>
      <script src="browser_main.js"></script>
  </body>
</html>

```
# What it does

This library aims to manage bitcoin data structures. It offers functionalities for

* Transactions and block headers deserialization

* Scripts creation

* Privatekeys, Publickeys and HDkeys management

* Transactions signing

# What it does not do

This library does not implement the following functionalities:

* Validation : when transactions and scripts are parsed, only
format errors are reported. No proof-of-work validation, script execution,
transaction validation and signature verification is performed

* Networking : this library does not provide functionalities to communicate with bitcoin nodes. Separates networking modules will be released soon.

# Tests

In order to run tests, cd in the package directory and run

`npm test`

To run tests in the browser, you first need [brfs](https://github.com/browserify/brfs) installed. Then you can run browserify on the tests file, by doing (within the package directory):

`browserify -t brfs test/test.js > test/browser_tests.js`

Now you can create the .html file with the test script:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Mocha Tests</title>
    <link rel="stylesheet" href="node_modules/mocha/mocha.css">
  </head>
  <body>
    <div id="mocha"></div>
    <script src="node_modules/mocha/mocha.js"></script>

    <script>mocha.setup('bdd')</script>
    <script src="test/browser_tests.js"></script>
    <script>
    mocha.run();
    </script>
  </body>
</html>
```
# Usage
On the first import, network setup must be executed. This is achieved by doing:

```javascript
const network = require('btcnodejs').network
network.setup('testnet') //network can be either 'testnet' or 'mainnet'
```
Once the network setup is executed, every subsequent setup will throw an exception.

The network module also exposes functionalities to get the current setup network

 ```javascript
 const network = require('btcnodejs').network
 network.setup('testnet')
 network.net_name()               //outputs 'testnet'
 network.is_mainnet()             //returns 'false'

  ```


# API

## Transactions
## `btcnodejs.Transaction`

Transactions are immutable objects representing bitcoin transactions.

#### Attributes

* **version : Integer**

* **inputs : list of Input objects**

* **outputs : list of Output objects**

* **locktime : Locktime object**

* **segwit : Boolean**

* **txid : String**

#### new Transaction(version, inputs, outputs, locktime, segwit=false)

#### toJSON()
Returns the JSON representation of the transaction
#### hash()
Computes the double sha256 on the serialized transaction.
Returns the hex string representing the hash
#### segwitId()
Computes the txid of a segwit transaction
Returns the hex string representing the id of the transaction.
#### static fromHex(hex)

* **hex : Hexadecimal string**

Returns a Transaction object

```javascript
const btcnodejs = require('btcnodejs')
const Transaction = btcnodejs.Transaction
btcnodejs.network.setup('testnet')

const tx = Transaction.fromHex("0100000001e4da173fbefe5e60ff63dfd38566ade407532294db655463b77a783f379ce605000000006b4" +
                               "83045022100af246c27890c2bc07a0b7450d3d82509702a44a4defdff766355240b114ee2ac02207bb67b" +
                               "468452fa1b325dd5583879f5c1412e0bb4dae1c2c96c7a408796ab76f1012102ab9e8575536a1e99604a1" +
                               "58fc60fe2ebd1cb1839e919b4ca42b8d050cfad71b2ffffffff0100c2eb0b000000001976a914df76c017" +
                               "354ac39bde796abe4294d31de8b5788a88ac00000000")

console.log(tx.txid)           //'e977c07090c2a1dcaefd3f3c4ebf4e231f4116cb272f805b0b22a85e7eece09c'


 ```

#### toHex()

Returns the hexadecimal representation of the transactions

#### serialize(segwit = this.segwit)

* **segwit : Boolean**

Returns a ByteBuffer containing the serialized transaction. If called with no parameter, the serialization is performed based on the transaction type. To perform a non-segwit serialization of a segwit transaction(i.e. to compute the segwit txid), false can be passed to the function.

#### static deserialize(bytebuffer)

* **bytebuffer : ByteBuffer object**

Returns a Transaction object from a ByteBuffer object representing the serialized transaction

#### toMutable()

Returns a MutableTransaction object

## `btcnodejs.MutableTransaction`

Mutable Transaction objects

#### Attributes

* **version : Integer**

* **inputs : list of Input objects**

* **outputs : list of Output objects**

* **locktime : Locktime object**

* **segwit : Boolean**

* **txid : String**

#### new MutableTransaction(version, inputs, outputs, locktime, segwit=false)

Returns a MutableTransaction object

#### toImmutable()

Returns an immutable Transaction object

#### spend(txouts, solvers)

* **txouts : List of Output objects**

* **solvers : List of Solver objects**

Returns a Transaction object where the scriptSigs of its inputs are computed.

```javascript
const btcnodejs = require('./lib/index')
btcnodejs.network.setup(network)
var t = new btcnodejs.Transaction(...)
var tospend = btcnodejs.Transaction.fromHex('...')
var key = btcnodejs.Privatekey.fromWIF(wif_key)
var solver = new btcnodejs.P2pkhSolver(key)
var unsigned = t.toMutable()
var spent = unsigned.spend([tospend.outputs[1]], [solver])
```

## `btcnodejs.Sighash`

Sighash object

#### Attributes
* **sighash : String**
  * **values : 'ALL' | 'NONE' | 'SINGLE'

* **anyonecanpay : Boolean**

#### new Sighash(sighash, anyonecanpay = false)

Returns a Sighash object

## `btcnodejs.Input`

Transaction Input object

#### Attributes

* **txid : String**

* **out : Integer**

* **scriptSig : ScriptSig object**

* **sequence : Sequence object**

* **witness : Witness object**

#### new Input(txid, out, scriptSig, sequence, witness = undefined)

Returns an Input object

#### toJSON()

Returns the JSON representation of the Input

## `btcnodejs.Output`

Transaction Output object

#### Attributes

* **amount : Integer**

* **scriptPubKey : scriptPubKey object**

#### new Output(amount, scriptPubKey)

Returns an Output object

#### toJSON()

Returns the JSON representation of the Output

## `btcnodejs.Witness`

Input Witness Object

#### Attributes

* **data : List of ByteBuffers**

#### new Witness(data)

Returns a Witness Object where data represents the required data to sign a transaction Input

#### serialize()

Returns a ByteBuffer representing the Witness serialization as it appears in a bitcoin transaction

#### toScriptSig()

Returns a ScriptSig object

#### toHex()

Returns the hexadecimal representation of the Witness object

## `btcnodejs.Sequence`

Sequence object representing the sequence number of a transaction Input

#### Attributes

* **n : Integer**

#### new Sequence(n)

Returns a Sequence object

#### isTime()

Returns a Boolean which tells if the Sequence is measured in time

#### isBlocks()

Returns a Boolean which tells if the Sequence is measured in blocks

#### isActive()

Returns a Boolean which tells if a Sequence restriction is active

## `btcnodejs.Locktime`

Locktime object representing the locktime on a transaction

#### Attributes

* **n : Integer**

#### new Locktime(n)

Returns a Locktime object

#### isTime()

Returns a Boolean which tells if the Locktime is measured in time

#### isBlocks()

Returns a Boolean which tells if the Locktime is measured in blocks

#### isActive()

Returns a Boolean which tells if a Locktime restriction is active

## Scripts



## `btcnodejs.Script`

Base Script object representing a general script as a ByteBuffer. Every Script class extends Script.

#### Attributes

* **body : ByteBuffer**

#### new Script(body)

Returns a Script object initialized from a bytebuffer representing the script

#### serialize()

Returns the body of the script_code

## `btcnodejs.ScriptSig`

ScriptSig object

#### toAsm()

Returns a string representing the ASM of the script

#### static fromAsm(asm)

Returns a ScriptSig from an ASM string

#### toHex()

Returns the hexadecimal representation of the ScriptSig

#### static fromHex(hex)

Returns a ScriptSig object from an hexadecimal string representing the body of the script


#### toWitness()

Returns a Witness object where its data is retrieved from the ScriptSig body removing the push operations

```javascript
const btcnodejs = require('btcnodejs')
const ScriptSig = btcnodejs.ScriptSig
btcnodejs.network.setup('testnet')

const sig = ScriptSig.fromHex("483045022100b7bf286e5f6ac6fa308e8876a8a59b289094851a26cf62c20abd174917eb7762022069b5269e584e4c7" +
                              "6f207d1b789bff7171a663d795e49751c12cf07dceb2a94c70121024a0dcb0527c2751ea4dda3aa98f6eface16e978d" +
                              "ba8062bcbed623f158c07691")

sig.toWitness().toHex()                           
// "02483045022100b7bf286e5f6ac6fa308e8876a8a59b289094851a26cf62c20abd174917eb7762022069b5269e584e4c76f207d1b789bff7171a663d795e49751c12c    f07dceb2a94c70121024a0dcb0527c2751ea4dda3aa98f6eface16e978dba8062bcbed623f158c07691"
 ```

## `btcnodejs.ScriptPubKey`

ScriptPubkey object representing a general script pubkey. It extends Script and is extended by specific ScriptPubkey types.

#### toHex()

Returns the hexadecimal representation of the ScriptPubKey

#### static fromHex(hex)

Returns a ScriptPubKey object from an hexadecimal string representing the body of the script. If the hex is representing an identifiable script, the fromHex() will return an instance of the specific ScriptPubKey. At the moment, identifiables scripts are P2pkh, P2sh, P2wpkhV0, P2wshV0, MultiSig

```javascript
const btcnodejs = require('btcnodejs')
const ScriptPubKey = btcnodejs.ScriptPubKey
btcnodejs.network.setup('testnet')

const spk = ScriptPubKey.fromHex('76a9148b4912ec0496b5f759f3af5ab24d6f4779a52f9e88ac')
spk instanceof btcnodejs.P2pkhScript         //true                             


 ```

#### toAddress(network = undefined, segwitV = undefined)

* **network : String**

* **segwitV : Integer**

Returns the p2sh/p2wsh address of the Script.
* If network is not specified, the initial setup network will be considered as the address network.

* If segwitV is specified, the address will be of type 'p2wsh', with segwitV value as the segwit version

```javascript
const btcnodejs = require('btcnodejs')
const ScriptPubKey = btcnodejs.ScriptPubKey
btcnodejs.network.setup('testnet')

const spk = ScriptPubKey.fromHex('76a9148b4912ec0496b5f759f3af5ab24d6f4779a52f9e88ac')
const p2pkh_address = spk.toAddress()
p2pkh_address.hash          // "029c09b86e1e4c3822bc71859af3300520d577c2"
p2pkh_address.toBase58()    // "2MsV2GNkfjxPjsp9ux2vwxW5HYaZh1HDtXJ


 ```

## `btcnodejs.P2pkhScript`

P2pkhScript object

#### new P2pkhScript(source)

* **source : Address object | Publickey object | ByteBuffer**

Returns a P2pkhScript object. This can be obtained from an Address, a Publickey or a ByteBuffer representing a pubkeyhash

#### Attributes

* **type : String**

* **pubkeyhash : ByteBuffer**

#### getAddress()

Returns an Address object representing the script Address

## `btcnodejs.P2wpkhV0Script`

Segwit version of P2pkhScript. It has the same interface of P2pkhScript but the source Address must be a Segwit Address object

#### getScriptCode()

Returns the ScriptCode of the P2wpkhV0Script

## `btcnodejs.P2shScript`

P2shScript object

#### Attributes

* **type : String**

* **scripthash : ByteBuffer**

#### new P2shScript(source)

* **source : Address object | ScriptPubKey object | ByteBuffer**

Returns a P2pkhScript object. This can be obtained from an Address, a ScriptPubKey or a ByteBuffer representing a scripthash

#### getAddress()

Returns an Address object representing the script Address

## `btcnodejs.P2wshV0Script`

Segwit version of P2shScript. It has the same interface of P2shScript but the source Address must be a Segwit Address object

## `btcnodejs.IfElseScript`

IfElseScript object


#### new IfElseScript(source)

* **source : Array of ScriptPubKey objects**


#### Attributes

* **type : String**

* **if_script : ScriptPubKey object**

* **else_script : ScriptPubKey object**


```javascript
const btcnodejs = require('btcnodejs')
btcnodejs.network.setup('testnet')

const p2pkh = new btcnodejs.P2pkhScript(btcnodejs.Publickey.fromHex("026263992eda6538202047f1514e0f6155a229c3d61b066807664e9ef73d406d95"))
const multisig = new btcnodejs.MultiSigScript([
        2,
        btcnodejs.Publickey.fromHex(
          "02c08786d63f78bd0a6777ffe9c978cf5899756cfc32bfad09a89e211aeb926242"
        ),
        btcnodejs.Publickey.fromHex(
          "033e81519ecf373ea3a5c7e1c051b71a898fb3438c9550e274d980f147eb4d069d"
        ),
        btcnodejs.Publickey.fromHex(
          "036d568125a969dc78b963b494fa7ed5f20ee9c2f2fc2c57f86c5df63089f2ed3a"
        ),
        3
      ])
const ie_script = new btcnodejs.IfElseScript([p2pkh, multisig])

 ```

## `btcnodejs.RelativeTimelockScript`

RelativeTimelockScript object

#### new RelativeTimelockScript(source)

* **source : Array[ScriptPubKey object, Sequence object]**

Returns a RelativeTimelockScript object

#### Attributes

* **sequence : Sequence object**

* **locked_script : ScriptPubKey object**

* **type : String**

## `btcnodejs.MultiSigScript`

MultisigScript object

#### new MultiSigScript(source)

* **source : [m, Publickey_1, Publickey_2, ... , Publickey_n, n]**

Returns a MultiSigScript object

#### Attributes

* **type : String**

* **m : Integer**

* **n : Integer**

* **pubkeys : Array of Publickey objects**

```javascript
const btcnodejs = require('btcnodejs')
btcnodejs.network.setup('testnet')

//Creating a 2-of-3 Multisig Script
const multisig = new btcnodejs.MultiSigScript([
        2,
        btcnodejs.Publickey.fromHex(
          "02c08786d63f78bd0a6777ffe9c978cf5899756cfc32bfad09a89e211aeb926242"
        ),
        btcnodejs.Publickey.fromHex(
          "033e81519ecf373ea3a5c7e1c051b71a898fb3438c9550e274d980f147eb4d069d"
        ),
        btcnodejs.Publickey.fromHex(
          "036d568125a969dc78b963b494fa7ed5f20ee9c2f2fc2c57f86c5df63089f2ed3a"
        ),
        3
      ])


 ```

## Solvers

Solvers are objects which are able to compute the scriptSig and Witness from a given array of digests. They are an easy way to compute transaction input's signatures.

They all provide the method:
#### solve(digests)

* **digests : Array of digests**

which returns an object :

**{scriptSig : ScriptSig object , witness: Witness object}**

```javascript
const btcnodejs = require('btcnodejs')
btcnodejs.network.setup('testnet')

const private_key = btcnodejs.Privatekey.fromHex('9b1b400e3b1211c6a56695cf1742f0a94ea38b995c1e1fb910458baa8a0874c4')
const p2pkh_solver = new btcnodejs.P2pkhSolver(private_key)

p2pkh_solver.solve(["0e12bda8a692aefa29651e87af9f47127ab098be1c189284e41d8e17a0516add"]).scriptSig.toHex()
//
'47304402202409f1f966c382f02e023ac828d7653e9268777bd1030e7101338f36a383fde302207ced2d14ff131d3b349bb00d3010a16f08831548e68750223cb8117cab553cab01210330e8ca46b7e5aa07d975ee152214431e419fac34e50becaf7e46db9a9c97d244'
```

## `btcnodejs.P2pkhSolver`

Solver for P2pkh Scripts

#### Attributes

* **privkey : Privatekey object**

* **sighash : Sighash object**

#### new P2pkhSolver(privkey, sighash = new Sighash('ALL'))

Returns a P2pkhSolver object

```javascript
const btcnodejs = require('btcnodejs')
btcnodejs.network.setup('testnet')

const private_key = btcnodejs.Privatekey.fromHex('9b1b400e3b1211c6a56695cf1742f0a94ea38b995c1e1fb910458baa8a0874c4')
const p2pkh_solver = new btcnodejs.P2pkhSolver(private_key)

```

## `btcnodejs.P2wpkhV0Solver`

Solver for P2wpkh version 0 scripts. It extends P2pkhSolver

## `btcnodejs.P2shSolver`

Solver for P2sh scripts

#### Attributes

* **redeemScript : ScriptPubKey object**

* **redeemScriptSolver : Solver object**

#### new P2shSolver(redeemScript, redeemScriptSolver)


## `btcnodejs.P2wshV0Solver`

Solver for P2wsh version 0 Scripts

#### Attributes

* **witnessScript : ScriptPubKey object**

* **witnessScriptSolver : Solver object**

#### new P2wshV0Solver(witnessScript, witnessScriptSolver)

## `btcnodejs.MultiSigSolver`

Solver for MultiSig Scripts

#### Attributes

* **privkeys : Array of Privatekey objects**

* **sighashes : Array of Sighash objects**

#### new MultiSigSolver(privkeys, sighashes = [new Sighash('ALL')])

The number of sigashes must be equal to the number of privatekeys.

## `btcnodejs.IfElseSolver`

Solver for If Else Scripts

#### Attributes

* **branch : Integer**

* **innerSolver : Solver object**

#### new IfElseSolver(branch, innerSolver)

## `btcnodejs.RelativeTimelockSolver`

#### Attributes

* **innerSolver : Solver object**

#### new RelativeTimelockSolver(innerSolver)

## Crypto

The library provides structures and methods to handle Private and Public key objects

## `btcnodejs.Privatekey`

#### Attributes

* **body : ByteBuffer**

#### new Privatekey(bytebuffer)

Returns a Privatekey object where the body is a bytebuffer representing the private key

#### static fromHex(hex)

* **hex : Hexadecimal String**

Returns a Privatekey object from an hexadecimal string representing a private key

#### toHex()

Returns the Hexadecimal representation of the Privatekey

#### serialize()

Returns the body of the Privatekey

#### getPublic(compressed = true)

* **compressed : Boolean**

Returns a Publickey object representing the public key associated with this Privatekey. By passing `compressed = false`, the public key will be of uncompressed type.

#### sign(message)

* **message : String**

Computes the signature of a message, using the [elliptic](https://github.com/indutny/elliptic) nodejs library using the `secp256k1` curve.

#### signDER(message)

Returns the signature of the message in `DER` encoding

#### toWIF(compressed = false)

Returns the [Wallet import format](https://en.bitcoin.it/wiki/Wallet_import_format) string representing the private key. If `true` is passed in input, the WIF string will represent a private key associated with a compressed Publickey.

#### fromWIF(wif_string)

* **wif_string : String**

Return a Privatekey object from its Wallet import format string.

#### fromBip32(bip32_string)

* **bip32_string : String**

Returns a Privatekey object from its Bip32 format string.

## `btcnodejs.Publickey`

Publickey object

#### Attributes

* **type: String**

* **uncompressed : ByteBuffer**

* **compressed : ByteBuffer**

#### new Publickey(bytebuffer)

Returns a Publickey object. Its type will be `odd`, `even`, `uncompressed` based on the the input bytebuffer data. It will keep both the uncompressed and compressed versions as its body, but its type will decide which version to use for any operation.

#### hash()

Returns the hash of the Publickey body.

#### static fromHex(hex)

Returns a Publickey object from its hexadecimal representation

#### toHex(compressed = true)

Returns the hexadecimal representation of its body. If `false` is passed as input it will return the hexadecimal representing its uncompressed version.

#### toAddress(network = undefined, segwit = false)

* **network : String**

* **segwit : Boolean**

Returns an Address object created from the Publickey hash.

* If network is undefined, the first network name setup will be used.

* If segwit is true, the Address type will be p2wpkh, otherwise it will be p2pkh

#### serialize()

Returns the Publickey body

## HD

This library exposes functionalities to manage Hierarchical deterministic keys. It makes usage of [bitcore-lib](https://github.com/bitpay/bitcore-lib) for some functionalities

## `btcnodejs.HDPrivateKey`

Hierarchical deterministic PrivateKey object

#### Attributes

* **privkey : Privatekey object**

* **depth : Integer**

* **fingerPrint : Integer**

* **parentFingerPrint : Integer**

* **childIndex : Integer**

* **chainCode : String**

* **checksum : Integer**

* **xprivkey : String**

#### new HDPrivateKey(source)

* **source : String | undefined**

Returns an HDPrivateKey object. If no parameter is given as input, a random HDPrivateKey is returned. Otherwise, a bip32 representation of an hd key can be passed

#### derive(path)

* **path : String**

Returns a child HDPrivateKey derived as specified in BIP32. The path must be a string starting with 'm/'. To derive an hardened child, its index in the path is followed by `'` i.e derive('m/0'')

#### getPublic()

Returns the corresponding HDPublicKey

#### static fromSeed(seed)

* **seed : String**

Returns a master HDPrivateKey generated from the hexadecimal string representing a seed

## `btcnodejs.HDPublicKey`

Hierarchical deterministic Public key object

#### Attributes

* **pubkey : Privatekey object**

* **depth : Integer**

* **fingerPrint : Integer**

* **parentFingerPrint : Integer**

* **childIndex : Integer**

* **chainCode : String**

* **checksum : Integer**

* **xpubkey : String**

#### new HDPublicKey(source)

* **source : String | undefined**

Returns an HDPublicKey object. If no parameter is given as input, a random HDPublicKey is returned. Otherwise, a bip32 representation of an hd key can be passed.

#### derive(path)

* **path : String**

Returns a child HDPublicKey derived as specified in BIP32.

## Address

This library exposes functionalities to manage bitcoin addresses. It wraps [bitcoinjs-lib](https://github.com/bitcoinjs/bitcoinjs-lib) for addresses encodings.

## `btcnodejs.Address`

#### Attributes

* **network : String**

* **type : String**

* **hash : ByteBuffer**

#### new Address(type, hash, network = undefined)

Returns an Address object. If network is not specified, the first setup network name will be used.

#### static fromBase58(base58string)

Returns an Address object from its base58 encoding

#### toBase58()

Returns a Base58 encoded string representing the bitcoin address

## `btcnodejs.SegwitAddress`

SegwitAddress object extending Address. It has an extra `version` attribute specifying the segwit version.

#### Attributes

* **version : Integer**

#### static fromBech32(bech32string)

Returns a Segwit Address object from its bech32 encoding

#### toBech32()

Returns a Bech32 encoded string representing the bitcoin Segwit address

## Block

## `btcnodejs.BlockHeader`

BlockHeader object

#### Attributes

* **version : Integer**

* **prev_block : String**

* **merkle_root : String**

* **timestamp : Integer**

* **bits : Integer**

* **nonce : Integer**

#### new BlockHeader(version, prev_block, merkle_root, timestamp, bits, nonce)

Returns a BlockHeader objects

#### static fromHex(hex)

Returns a BlockHeader object from an hexadecimal string representing the associated BlockHeader

#### serialize()

Returns a ByteBuffer representing the serialized BlockHeader

#### blockHash()

Returns an hexadecimal string representing the hash of the associated Block

## TODO

* Expand the test vectors

* Add docstrings to code

* Manage Block and MerkleBlock structures

* Add caching in segwit digests computation

* Add further helpers for creating transactions

* Implement the functionalities which are now wrappings around external libraries

* Manage `OP_CODESEPARATOR` in transaction signatures
