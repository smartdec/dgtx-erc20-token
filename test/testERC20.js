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


/*
 * For all functions that returns success bool value should be added this value check. Up to date there is no
 * way to get the return value of transaction (non constant calls) in truffle. As a result in this test assumes
 * that functions such transfer, transferFrom, approve throw if and only if action can't be successfully completed.
 */

const Token = artifacts.require("DGTXToken");
const ERC20Mock = artifacts.require("ERC20Mock");

contract("ERC20", function (accounts) {
    let tokenDeployed;
    let token;
    let now;

    // Get block timestamp.
    beforeEach(async () => {
        token = await ERC20Mock.at((await Token.deployed()).address);
        let dgtx_token = await Token.at((await Token.deployed()).address);
        dgtx_token.mint(accounts[0], web3.utils.toBN(10**18))

        now = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
    });
    describe("Checking existence of functions:", async function () {
        it("totalSupply", async function () {
            let supply = await token.totalSupply();
            expect(supply).to.be.exist("Value must present");
        });
        it("balanceOf ", async function () {
            let res = await token.balanceOf(accounts[0], {from: accounts[0]});
            expect(res).to.be.exist("Value must present");
        });
        it("tranfser", async function () {
            let res = await token.transfer(accounts[1], 1000, {from: accounts[0]});
            expect(res).to.be.exist("Value must present");
        });
        it("transferFrom", async function () {
            await token.approve(accounts[0], 1000, {from: accounts[0]});
            let res = await token.transferFrom(accounts[0], accounts[1], 1000, {from: accounts[0]});
            expect(res).to.be.exist("Value must present");
        });
        it("approve", async function () {
            let res = await token.approve(accounts[1], 1000, {from: accounts[0]});
            expect(res).to.be.exist("Value must present");
        });
        it("allowance", async function () {
            let res = await token.allowance(accounts[0], accounts[1]);
            expect(res).to.be.exist("Value must present");
        });
    });
    describe("OPTIONAL: Checking existence of functions:", async function () {
        it("name", async function () {
            let name = await token.name();
            expect(name).to.be.not.empty("Name can't be an empty string.");
        });
        it("symbol", async function () {
            let symbol = await token.symbol();
            expect(symbol).to.be.not.empty("Symbol can't be an empty string.");
        });
        it("decimals", async function () {
            let decimals = await token.decimals();
            expect(decimals).to.be.not.negative("Decimals can't be negative");
        });
    });
    describe("Checking transfer function https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md#transfer", async function () {
        //https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md#transfer
        it("success 1000 tokens transfer", async function () {
            let balance_1_old = await token.balanceOf(accounts[0]);
            let balance_2_old = await token.balanceOf(accounts[1]);

            let res = await token.transfer(accounts[1], 1000, {from: accounts[0]});

            let balance_1_new = await token.balanceOf(accounts[0]);
            let balance_2_new = await token.balanceOf(accounts[1]);

            expect(balance_1_new).to.be.eq(web3.utils.toBN(balance_1_old.subn(1000)), "Source account wrong amount of tokens");
            expect(balance_2_new).to.be.eq(web3.utils.toBN(balance_2_old.addn(1000)), "Destination account wrong amount of tokens");

            let tr_event = findEvent(res.logs, 'Transfer');

            expect(tr_event).to.be.exist("'Transfer' event wasn't occurred");
            expect(tr_event._from).to.be.eq(accounts[0], "Wrong 'Transfer' event '_from' argument");
            expect(tr_event._to).to.be.eq(accounts[1], "Wrong 'Transfer' event '_to' argument");
            expect(tr_event._value).to.be.eq(web3.utils.toBN(1000), "Wrong 'Transfer' event '_value' argument");
        });
        it("success 0 tokens transfer", async function () {
            let balance_1_old = await token.balanceOf(accounts[0]);
            let balance_2_old = await token.balanceOf(accounts[1]);

            let res = await token.transfer(accounts[1], 0, {from: accounts[0]});

            let balance_1_new = await token.balanceOf(accounts[0]);
            let balance_2_new = await token.balanceOf(accounts[1]);

            expect(balance_1_new).to.be.eq(web3.utils.toBN(balance_1_old), "Source account wrong amount of tokens");
            expect(balance_2_new).to.be.eq(web3.utils.toBN(balance_2_old), "Destination account wrong amount of tokens");

            let tr_event = findEvent(res.logs, 'Transfer');

            expect(tr_event).to.be.exist("'Transfer' event wasn't occurred");
            expect(tr_event._from).to.be.eq(accounts[0], "Wrong 'Transfer' event '_from' argument");
            expect(tr_event._to).to.be.eq(accounts[1], "Wrong 'Transfer' event '_to' argument");
            expect(tr_event._value).to.be.eq(web3.utils.toBN(0), "Wrong 'Transfer' event '_value' argument");
        });
        it("failed more than balance transfer", async function () {

            let balance_old = await token.balanceOf(accounts[1]);
            let res = await expectRevert(token.transfer(accounts[0], balance_old.addn(2), {from: accounts[1]}));
            let balance_new = await token.balanceOf(accounts[1]);

            expect(balance_old).to.be.eq(web3.utils.toBN(balance_new), "Transfer wan't thrown, but balance was changed");
        });
    });
    describe("Checking approve function", async function () {
        it("Basic allowance action", async function () {
            let res = await token.approve(accounts[1], 1000, {from: accounts[0]});

            expect(res).to.exist();

            let approved_amount = await token.allowance(accounts[0], accounts[1]);

            expect(approved_amount).to.be.eq(web3.utils.toBN(1000), "Wrong allowance after approve");

            let appr_event = findEvent(res.logs, "Approval");
            expect(appr_event).to.exist("'Approval' event wasn't occurred");
            expect(appr_event._owner).to.be.eq(accounts[0], "Wrong 'Approval' event 'owner' argument");
            expect(appr_event._spender).to.be.eq(accounts[1], "Wrong 'Approval' event 'spender' argument");
            expect(appr_event._value).to.be.eq(web3.utils.toBN(1000), "Wrong 'Approval' event 'value' argument");
        });
        it("Approve 0 tokens", async function () {
            let res = await token.approve(accounts[1], 0, {from: accounts[0]});

            expect(res).to.exist();

            let approved = await token.allowance(accounts[0], accounts[1]);
            expect(approved).to.be.eq(web3.utils.toBN(0, "Approved value is not zero."));
        });

        it("Allowance rewrite", async function () {
            await token.approve(accounts[1], 1000, {from: accounts[0]});
            expect(await token.allowance(accounts[0], accounts[1])).to.be.eq(web3.utils.toBN(1000, "Wrong new value of allowance"));
            await token.approve(accounts[1], 2000, {from: accounts[0]});
            expect(await token.allowance(accounts[0], accounts[1])).to.be.eq(web3.utils.toBN(2000, "Wrong new value of allowance"));
            await token.approve(accounts[1], 500, {from: accounts[0]});
            expect(await token.allowance(accounts[0], accounts[1])).to.be.eq(web3.utils.toBN(500, "Wrong new value of allowance"));
        });
    });

    it("Basic delegated transfer", async function () {
        await token.approve(accounts[1], 1000, {from: accounts[0]});

        var balance_2_old = await token.balanceOf.call(accounts[1]);
        var balance_1_old = await token.balanceOf.call(accounts[0]);

        var res = await token.transferFrom(accounts[0], accounts[1], 1000, {from: accounts[1]});

        var balance_2_new = await token.balanceOf.call(accounts[1]);
        var balance_1_new = await token.balanceOf.call(accounts[0]);

        assert.equal(balance_2_new.sub(balance_2_old).toNumber(), 1000, "Destination account wrong amount of tokens");
        assert.equal(balance_1_old.sub(balance_1_new).toNumber(), 1000, "Source account wrong amount of tokens");

        var tr_event = findEvent(res.logs, 'Transfer');

        assert.isDefined(tr_event, "'Transfer' event wasn't occurred");
        assert.equal(tr_event._from, accounts[0], "Wrong 'Transfer' event 'from' argument");
        assert.equal(tr_event._to, accounts[1], "Wrong 'Transfer' event 'to' argument");
        assert.equal(tr_event._value.toNumber(), 1000, "Wrong 'Transfer' event 'value' argument");
    });
    it("Try to transfer without allowance.", async function () {


        var balance_1_old = await token.balanceOf.call(accounts[1]);
        var balance_0_old = await token.balanceOf.call(accounts[0]);

        var success = false;
        try {
            await token.transferFrom(accounts[1], accounts[0], 1000, {from: accounts[0]});
            success = true;
        } catch (e) {
            var balance_1_new = await token.balanceOf.call(accounts[1]);
            assert.equal(balance_1_old.sub(balance_1_new).toNumber(), 0, "Transfer thrown, but balance of accounts[1] has changed.")

            var balance_0_new = await token.balanceOf.call(accounts[0]);
            assert.equal(balance_0_old.sub(balance_0_new).toNumber(), 0, "Transfer thrown, but balance of accounts[0] has changed.")
        }

        if (success) throw new Error("transferFrom function didn't throw when transfer without allowance.");
    });
    it("Delegated transfer 1000 by two parts", async function () {

        await token.approve(accounts[1], 1000, {from: accounts[0]});

        var balance_2_old = await token.balanceOf.call(accounts[1]);
        var balance_1_old = await token.balanceOf.call(accounts[0]);

        try {
            await token.transferFrom(accounts[0], accounts[1], 600, {from: accounts[1]});
        } catch (e) {
            throw new Error("The first delegated transfer (600 from 1000 allowed) was unsuccessful.")
        }

        try {
            await token.transferFrom(accounts[0], accounts[1], 400, {from: accounts[1]});
        } catch (e) {
            throw new Error("The second delegated transfer (400 from 1000 allowed) was unsuccessful.")
        }

        var balance_2_new = await token.balanceOf.call(accounts[1]);
        var balance_1_new = await token.balanceOf.call(accounts[0]);

        assert.equal(balance_2_new.sub(balance_2_old).toNumber(), 1000, "Destination account wrong amount of tokens")
        assert.equal(balance_1_old.sub(balance_1_new).toNumber(), 1000, "Source account wrong amount of tokens")

    });
    it("Delegated transfer more than allowed. Should fail", async function () {

        await token.approve(accounts[1], 1000, {from: accounts[0]});
        var balance_1_old = await token.balanceOf.call(accounts[1]);
        var balance_0_old = await token.balanceOf.call(accounts[0]);

        var success = false;
        try {
            await token.transferFrom(accounts[0], accounts[1], 2000, {from: accounts[1]});
            success = true;
        } catch (e) {
            var balance_1_new = await token.balanceOf.call(accounts[1]);
            assert.equal(balance_1_old.sub(balance_1_new).toNumber(), 0, "Transfer thrown, but balance of accounts[1] (sender) has changed.")

            var balance_0_new = await token.balanceOf.call(accounts[0]);
            assert.equal(balance_0_old.sub(balance_0_new).toNumber(), 0, "Transfer thrown, but balance of accounts[0] (owner) has changed.")
        }

        if (success) throw new Error("transferFrom function didn't throw when transfer more than allowed.");
    });
    it("Delegated 1000, transfer 500, change allowance on zero. Next transfer should fail.", async function () {


        var balance_1_old = await token.balanceOf.call(accounts[1]);
        var balance_0_old = await token.balanceOf.call(accounts[0]);

        await token.approve(accounts[1], 1000, {from: accounts[0]});

        await token.transferFrom(accounts[0], accounts[1], 500, {from: accounts[1]});

        var balance_1_mid = await token.balanceOf.call(accounts[1]);
        var balance_0_mid = await token.balanceOf.call(accounts[0]);

        assert.equal(balance_1_mid.sub(balance_1_old).toNumber(), 500, "Wrong amount tokens on destination account after transfer");
        assert.equal(balance_0_old.sub(balance_0_mid).toNumber(), 500, "Wrong amount tokens on source account after transfer");

        await token.approve(accounts[1], 0, {from: accounts[0]});

        var success = false;
        try {
            await token.transferFrom(accounts[0], accounts[1], 500, {from: accounts[1]});
            success = true;
        } catch (e) {

        }
        if (success) throw new Error("Transfer is successful after ban of allowance.\nWarning! This test is transaction" +
            "order dependence. Here is potential vulnerability. It described on standard page https://goo.gl/w46B76")
    });
    it("Try to delegated transfer with not enough balance", async function () {
        var balance = await token.balanceOf.call(accounts[1]);
        balance = balance.toNumber();
        if (balance < 1000) {
            await token.transfer(accounts[1], 1000 - balance, {from: accounts[0]});
            balance = 1000
        }

        var res = await token.approve(accounts[2], 1000, {from: accounts[1]});
        assert.isOk(res, "Approve returned false");

        res = await token.transfer(accounts[0], balance - 500, {from: accounts[1]});
        assert.isOk(res, "Transfer returned false");

        var success = false;
        try {
            success |= await token.transferFrom(accounts[1], accounts[0], 1000, {from: accounts[2]});
        } catch (e) {
        }

        if (success) throw new Error("Can delegated transfer tokens from account, when not enough tokens.");

        var balance_new = await token.balanceOf.call(accounts[1]);
        assert.equal(balance_new.toNumber(), 500, "Transfer failed, but balance of account has changed.");

        var approved = await token.allowance.call(accounts[1], accounts[2]);

        assert.equal(approved.toNumber(), 1000, "Approved amount has been changed.");
    });
});
