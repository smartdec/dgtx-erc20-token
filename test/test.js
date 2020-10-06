const chai = require('chai');
const dirtyChai = require('dirty-chai');
const bnChai = require('bn-chai');


require('chai')
    .use(require('chai-as-promised'))
    .use(bnChai(web3.utils.BN))
    .should();

import expectRevert from './helpers/expectRevert';

chai.use(dirtyChai);

const {expect} = chai;
const {assert} = chai;


// Finds one event with given name from logs. If there are more than one events, returns one of them arbitrarily.
const findEvent = function (logs, eventName) {
    let result = undefined;
    logs.forEach(function (item, i, arr) {
        if (item.event === eventName) {
            result = item.args;
        }
    });
    return result;
};


contract("DGTXToken", function (accounts) {
    let now;

    // Get block timestamp.
    beforeEach(async () => {
        now = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
    });
    it("DGTX Token Test", async function () {
    });
});
