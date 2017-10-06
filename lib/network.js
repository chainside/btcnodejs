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
