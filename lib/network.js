/*
Copyright (C) 2017 chainside srl

This file is part of the btcnodejs package.

It is subject to the license terms in the LICENSE.md file found in the top-level
directory of this distribution.

No part of btcnodejs, including this file, may be copied, modified,
propagated, or distributed except according to the terms contained in the
LICENSE.md file.
*/
var MAINNET = undefined;
var NETNAME = undefined;
function setup(network = "testnet", testing = false) {
  if (MAINNET != undefined && !testing) throw new Error("Network setup already executed");
  if (network != "mainnet" && network != "testnet")
    throw "Invalid network type: valid types are 'mainnet' or 'testnet'";
  MAINNET = network == "mainnet";
  NETNAME = network;
}
function net_name() {
  if (!NETNAME) throw new Error("Netwok setup not executed");
  return NETNAME;
}
function is_mainnet() {
  if (MAINNET == undefined) throw new Error("Netwok setup not executed");
  return MAINNET;
}
module.exports = {
  setup,
  net_name,
  is_mainnet
};
