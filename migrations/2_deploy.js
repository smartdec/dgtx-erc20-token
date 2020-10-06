var Token = artifacts.require("DGTXToken");

module.exports = function(deployer, network, accounts) {
    deployer.deploy(Token);
};
