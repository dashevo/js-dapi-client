'use strict'

const {spawn} = require('child_process');

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
const expect = chai.expect;

const BitcoreLib = require('@dashevo/dashcore-lib');
const {privateKeyString} = require('../../examples/data');
const Api = require('../../src/api');
const {PrivateKey, PublicKey, Address} = BitcoreLib;
const {Registration} = BitcoreLib.Transaction.SubscriptionTransactions;
const {TopUp} = BitcoreLib.Transaction.SubscriptionTransactions;

const config = require('../../src/config');

config.Api.port = 3000;

const testPrivateKey = new PrivateKey();
let api;
let address;
let privateKey;
let publicKey;
let fundingInDuffs = 1000 * 1000;

const timeout = ms => new Promise(res => setTimeout(res, ms));


async function registerUser(username, prKeyString, requestedFunding, skipSign, signature) {
    const privateKey = new PrivateKey(prKeyString);
    const publicKey = PublicKey.fromPrivateKey(privateKey);
    // Change to livenet, if you want to create address for livenet
    // You need to top up this address first
    const address = Address.fromPublicKey(publicKey, 'testnet').toString();

    // Getting available inputs
    const inputs = await api.getUTXO(address);

    const subTx = Registration.createRegistration(username, privateKey, requestedFunding);
    // Must be bigger than dust amount
    const lFundingInDuffs = requestedFunding || 1000 * 1000; // 0.01 Dash

    api.getBalance(address);

    subTx.fund(inputs, address, lFundingInDuffs);
    if (skipSign === undefined || !skipSign) {
        await subTx.sign(privateKey, signature == undefined ? undefined : signature);
    }
    // Send registration transaction to the network
    return api.sendRawTransaction(subTx.serialize());
}


describe('sync.topup_user_credits', () => {
    before(async () => {
        // Need to start mn-bootstrap
        api = new Api();

        privateKey = new PrivateKey(privateKeyString);
        publicKey = PublicKey.fromPrivateKey(privateKey);
        address = Address.fromPublicKey(publicKey, 'testnet').toString();
    });

    beforeEach(async () => {
        await timeout(500);
    });

    before(async () => {
    });

    after(async () => {
    });

    it('Should go through the full Top UP process', async () => {
        let username = Math.random().toString(36).substring(7);
        await registerUser(username, privateKeyString, 10000);

        await api.generate(7);

        let blockChainUserAfterCreation = await api.getUser(username);

        console.log(blockChainUserAfterCreation)


        expect(blockChainUserAfterCreation.uname).to.equal(username);
        expect(blockChainUserAfterCreation.credits).to.equal(10000);
        expect(blockChainUserAfterCreation.state).to.equal('open');
        expect(blockChainUserAfterCreation.subtx).to.have.lengthOf(1);
        expect(blockChainUserAfterCreation.transitions).to.have.lengthOf(0);
        expect(blockChainUserAfterCreation.from_mempool).to.equal(undefined)
        var pubkeyid1 = blockChainUserAfterCreation.pubkeyid
        var regtxid1 = blockChainUserAfterCreation.regtxid
        var subtx1 = blockChainUserAfterCreation.subtx

        let inputs = await api.getUTXO(address);
        let subTx = new TopUp();
        subTx
            .fund(blockChainUserAfterCreation.regtxid, fundingInDuffs, inputs, address);

        expect(subTx).to.be.an('object');
        expect(subTx.inputs).to.have.lengthOf(1);
        expect(subTx.nLockTime).to.equal(0);
        expect(subTx.outputs).to.have.lengthOf(2);
        expect(subTx.version).to.equal(1);
        subTx.sign(privateKey);
        let txId = await api.sendRawTransaction(subTx.serialize());
        expect(txId).to.be.an('object').that.has.all.keys('txid');

        let blockChainUserAfterTopUp = await api.getUser(username);

        expect(blockChainUserAfterTopUp.uname).to.equal(username);
        expect(blockChainUserAfterTopUp.credits).to.equal(10000 + fundingInDuffs);
        expect(blockChainUserAfterTopUp.state).to.equal('open');
        expect(blockChainUserAfterTopUp.subtx).to.have.lengthOf(1);
        expect(blockChainUserAfterTopUp.transitions).to.have.lengthOf(0);
        expect(blockChainUserAfterTopUp.from_mempool).to.equal(true)
        var pubkeyid2 = blockChainUserAfterTopUp.pubkeyid
        var regtxid2 = blockChainUserAfterTopUp.regtxid
        var subtx2 = blockChainUserAfterTopUp.subtx

        await api.generate(1);

        let blockChainUserAfterBlockGen = await api.getUser(username);
        console.log(blockChainUserAfterBlockGen)

        expect(blockChainUserAfterBlockGen.uname).to.equal(username);
        expect(blockChainUserAfterBlockGen.credits).to.equal(10000 + fundingInDuffs);
        expect(blockChainUserAfterBlockGen.state).to.equal('open');
        expect(blockChainUserAfterBlockGen.subtx).to.have.lengthOf(2);
        expect(blockChainUserAfterBlockGen.transitions).to.have.lengthOf(0);
        expect(blockChainUserAfterBlockGen.from_mempool).to.equal(undefined)
        var pubkeyid3 = blockChainUserAfterBlockGen.pubkeyid
        var regtxid3 = blockChainUserAfterBlockGen.regtxid
        var subtx3 = blockChainUserAfterBlockGen.subtx

        expect(pubkeyid1).to.equal(pubkeyid2);
        expect(pubkeyid2).to.equal(pubkeyid3);
        expect(regtxid1).to.equal(regtxid2);
        expect(regtxid2).to.equal(regtxid3);
        expect(subtx1).to.deep.equal(subtx2);
        expect(subtx2).to.deep.equal([subtx3[0]]);
    });

    it('Should be able sequential funding with signing', async () => {
        let username = Math.random().toString(36).substring(7);
        await registerUser(username, privateKeyString, 10000);
        await api.generate(7);

        var expectedCredits = 10000
        let nums = [1, 2, 3, 4];
        for (let num of nums) {
            let blockChainUser = await api.getUser(username);
            let inputs = await api.getUTXO(address);
            let subTx = new TopUp();
            subTx
                .fund(blockChainUser.regtxid, fundingInDuffs * num, inputs, address);
            expectedCredits += fundingInDuffs * num
            expect(subTx).to.be.an('object');
            expect(subTx.inputs).to.have.lengthOf(1);
            expect(subTx.nLockTime).to.equal(0);
            expect(subTx.outputs).to.have.lengthOf(2);
            expect(subTx.version).to.equal(1);
            subTx.sign(privateKey);
            let txId = await api.sendRawTransaction(subTx.serialize());
            expect(txId).to.be.an('object').that.has.all.keys('txid');

            blockChainUser = await api.getUser(username);
            console.log(blockChainUser)
            expect(blockChainUser.uname).to.equal(username);
            expect(blockChainUser.credits).to.equal(expectedCredits);
            expect(blockChainUser.state).to.equal('open');
            expect(blockChainUser.subtx).to.have.lengthOf(1);
            expect(blockChainUser.transitions).to.have.lengthOf(0);
            expect(blockChainUser.from_mempool).to.equal(true)
        }
    });

    it('Should throw error when try to reuse input', async () => {
        let username = Math.random().toString(36).substring(7);
        await registerUser(username, privateKeyString, 10000);
        await api.generate(7);

        let blockChainUser = await api.getUser(username);
        let subTx = new TopUp();
        let inputs = await api.getUTXO(address);
        await subTx
            .fund(blockChainUser.regtxid, fundingInDuffs, inputs, address);
        subTx.sign(privateKey);
        let txId = await api.sendRawTransaction(subTx.serialize());
        expect(txId).to.be.an('object').that.has.all.keys('txid');

        // we need to reset 'inputs = await api.getUTXO(address)' but we skip it expressly
        subTx = new TopUp();
        blockChainUser = await api.getUser(username);
        await subTx
            .fund(blockChainUser.regtxid, fundingInDuffs * 5, inputs, address);
        subTx.sign(privateKey);
        return expect(
            api.sendRawTransaction(subTx.serialize())
        ).to.be.rejectedWith('DAPI RPC error: sendRawTransaction: 400 - "258: txn-mempool-conflict. Code:-26"');

    });

    it('Should throw error when try to reuse input with the same TopUp instance', async () => {
        let username = Math.random().toString(36).substring(7);
        await registerUser(username, privateKeyString, 10000);
        await api.generate(7);

        let blockChainUser = await api.getUser(username);
        let subTx = new TopUp();
        let inputs = await api.getUTXO(address);
        await subTx
            .fund(blockChainUser.regtxid, fundingInDuffs, inputs, address);
        subTx.sign(privateKey);
        let txId = await api.sendRawTransaction(subTx.serialize());
        expect(txId).to.be.an('object').that.has.all.keys('txid');

        // we need to reset 'inputs = await api.getUTXO(address)' but we skip it expressly
        // subTx = new TopUp();
        blockChainUser = await api.getUser(username);
        await subTx
            .fund(blockChainUser.regtxid, fundingInDuffs * 5, inputs, address);
        subTx.sign(privateKey);
        return expect(
            api.sendRawTransaction(subTx.serialize())
        ).to.be.rejectedWith('DAPI RPC error: sendRawTransaction: 400 - "16: bad-txns-inputs-duplicate. Code:-26"');

    });

    it('SendRawTransaction pass when re-sign with valid privateKey', async () => {
        let username = Math.random().toString(36).substring(7);
        await registerUser(username, privateKeyString, 10000);
        await api.generate(7);

        let blockChainUser = await api.getUser(username);
        let subTx = new TopUp();
        let inputs = await api.getUTXO(address);

        await subTx
            .fund(blockChainUser.regtxid, fundingInDuffs, inputs, address);
        // try to use wrong privateKey
        expect(() => subTx.serialize()).to.throw('Some inputs have not been fully signed');
    });

    it('SendRawTransaction pass when re-sign with valid privateKey', async () => {
        let username = Math.random().toString(36).substring(7);
        await registerUser(username, privateKeyString, 10000);
        await api.generate(7);

        let blockChainUser = await api.getUser(username);
        let subTx = new TopUp();
        let inputs = await api.getUTXO(address);

        await subTx
            .fund(blockChainUser.regtxid, fundingInDuffs, inputs, address);
        // the first one is wrong privateKey
        subTx.sign(testPrivateKey);
        subTx.sign(privateKey);
        await api.sendRawTransaction(subTx.serialize());
    });

    var fees = [0, 1, 100, 666];
    fees.forEach(function (fee) {
        it('Serialize should throw error when fee is too small', async () => {
            let username = Math.random().toString(36).substring(7);
            await registerUser(username, privateKeyString, 10000);
            await api.generate(7);

            let blockChainUser = await api.getUser(username);
            let subTx = new TopUp();
            let inputs = await api.getUTXO(address);

            await subTx
                .fund(blockChainUser.regtxid, fundingInDuffs, inputs, address);
            expect(subTx).to.be.an('object');
            expect(subTx.inputs).to.have.lengthOf(1);
            expect(subTx.nLockTime).to.equal(0);
            expect(subTx.outputs).to.have.lengthOf(2);
            expect(subTx.version).to.equal(1);
            subTx.fee(fee).sign(privateKey);
            expect(() => subTx.serialize()).to.throw('Fee is too small: expected more than 667 but got ' + fee + ' - For more information please see');
        });
    });

    it('Should topup with the minimum fee=667', async () => {
        let username = Math.random().toString(36).substring(7);
        await registerUser(username, privateKeyString, 10000);
        await api.generate(7);

        let blockChainUser = await api.getUser(username);
        let subTx = new TopUp();
        let inputs = await api.getUTXO(address);

        await subTx
            .fund(blockChainUser.regtxid, fundingInDuffs, inputs, address);
        expect(subTx).to.be.an('object');
        expect(subTx.inputs).to.have.lengthOf(1);
        expect(subTx.nLockTime).to.equal(0);
        expect(subTx.outputs).to.have.lengthOf(2);
        expect(subTx.version).to.equal(1);
        subTx.fee(667).sign(privateKey);
        await api.sendRawTransaction(subTx.serialize());
    });

    it('Should throw error when try to resue TopUp object', async () => {
        let username = Math.random().toString(36).substring(7);
        await registerUser(username, privateKeyString, 10000);
        await api.generate(7);

        let blockChainUser = await api.getUser(username);
        let subTx = new TopUp();
        let inputs = await api.getUTXO(address);

        await subTx
            .fund(blockChainUser.regtxid, fundingInDuffs, inputs, address);
        expect(subTx).to.be.an('object');
        expect(subTx.inputs).to.have.lengthOf(1);
        expect(subTx.nLockTime).to.equal(0);
        expect(subTx.outputs).to.have.lengthOf(2);
        expect(subTx.version).to.equal(1);
        subTx.fee(1000).sign(privateKey);
        let txId = await api.sendRawTransaction(subTx.serialize());
        expect(txId).to.be.an('object').that.has.all.keys('txid');

        inputs = await api.getUTXO(address);

        blockChainUser = await api.getUser(username);
        // we need to reinitialize 'subTx = new TopUp()' but  we skip it expressly
        await subTx
            .fund(blockChainUser.regtxid, fundingInDuffs * 5, inputs, address);
        expect(subTx).to.be.an('object');
        expect(subTx.inputs).to.have.lengthOf(2);
        expect(subTx.nLockTime).to.equal(0);
        expect(subTx.outputs).to.have.lengthOf(3);
        expect(subTx.version).to.equal(1);
        subTx.fee(2000).sign(privateKey);
        return expect(
            api.sendRawTransaction(subTx.serialize())
        ).to.be.rejectedWith('DAPI RPC error: sendRawTransaction: 400 - "16: bad-subtx-badchange. Code:-26"');
    });

    var fees = [150001, 300000];
    fees.forEach(function (fee) {
        it('Should throw error when fee is too larg', async () => {
            let username = Math.random().toString(36).substring(7);
            await registerUser(username, privateKeyString, fundingInDuffs);
            await api.generate(7);

            let blockChainUser = await api.getUser(username);
            let subTx = new TopUp();
            let inputs = await api.getUTXO(address);

            await subTx.fund(blockChainUser.regtxid, fundingInDuffs, inputs, address);

            subTx.fee(fee).sign();
            expect(() => subTx.serialize()).to.throw('Fee is too large: expected less than 150000 but got ' + fee);
        });
    });

    it('Should topup with the maximum fee=150000', async () => {
        let username = Math.random().toString(36).substring(7);
        await registerUser(username, privateKeyString, 10000);
        await api.generate(7);

        let blockChainUser = await api.getUser(username);
        let subTx = new TopUp();
        let inputs = await api.getUTXO(address);

        await subTx
            .fund(blockChainUser.regtxid, fundingInDuffs, inputs, address);
        expect(subTx).to.be.an('object');
        expect(subTx.inputs).to.have.lengthOf(1);
        expect(subTx.nLockTime).to.equal(0);
        expect(subTx.outputs).to.have.lengthOf(2);
        expect(subTx.version).to.equal(1);
        subTx.fee(150000).sign(privateKey);
        await api.sendRawTransaction(subTx.serialize());

    });

    it('Output satoshis are invalid when fund->fee->sing', async () => {
        let testFundingAmount = 10000;
        let username = Math.random().toString(36).substring(7);
        await registerUser(username, privateKeyString, fundingInDuffs);
        await api.generate(7);

        let blockChainUser = await api.getUser(username);
        let subTx = new TopUp();
        let inputs = await api.getUTXO(address);

        await subTx.fund(blockChainUser.regtxid, testFundingAmount, inputs, address);
        expect(subTx).to.be.an('object');
        expect(subTx.inputs).to.have.lengthOf(1);
        let in11 = subTx.inputs[0];
        expect(subTx.nLockTime).to.equal(0);
        expect(subTx.outputs).to.have.lengthOf(2);
        let out12 = subTx.outputs[0];
        let out11 = subTx.outputs[1];
        expect(subTx.version).to.equal(1);

        var feeValue = 1000;
        subTx.fee(feeValue).sign();
        expect(subTx).to.be.an('object');
        expect(subTx.inputs).to.have.lengthOf(1);
        let in21 = subTx.inputs[0];
        expect(subTx.nLockTime).to.equal(0);
        expect(subTx.outputs).to.have.lengthOf(2);
        let out22 = subTx.outputs[0];
        let out21 = subTx.outputs[1];
        expect(subTx.version).to.equal(1);

        // take into account fee( only last fee should be applied)
        in11.output._satoshis -= feeValue;
        expect(in11).to.equal(in21);
        out11._satoshis += testFundingAmount;
        out11._satoshis -= feeValue;
        out11._satoshisBN.words[0] += testFundingAmount;
        out11._satoshisBN.words[0] -= feeValue;
        expect(out11).to.deep.equal(out21);
        out12._satoshis -= feeValue;
        expect(out12).to.equal(out22);

        expect(() => subTx.serialize()).to.throw('Output satoshis are invalid');
    });

    it('Error not throwing when inputs satoshi has been changed when funding', async () => { // TODO WHY?
        let username = Math.random().toString(36).substring(7);
        await registerUser(username, privateKeyString, 10000);
        await api.generate(7);

        let blockChainUser = await api.getUser(username);
        let subTx = new TopUp();
        let inputs = await api.getUTXO(address);
        inputs[0].satoshis += 10000;
        subTx
            .fund(blockChainUser.regtxid, fundingInDuffs, inputs, address)
        subTx.sign(privateKey);
        await api.sendRawTransaction(subTx.serialize());
    });


    it('Error throwing when inputs address has been changed when funding', async () => { // TODO WHY?
        let username = Math.random().toString(36).substring(7);
        await registerUser(username, privateKeyString, 10000);
        await api.generate(7);

        let blockChainUser = await api.getUser(username);
        let subTx = new TopUp();
        let inputs = await api.getUTXO(address);
        inputs[0].address = 'ygPcCwVy6Fxg7ruxZzqVYdPLtvw7auHAFh';
        expect(() => subTx
            .fund(blockChainUser.regtxid, fundingInDuffs, inputs, address)).to.throw('Checksum mismatch');
    });

    it('Error throwing when inputs amount has been changed when funding', async () => { // TODO WHY?
        let username = Math.random().toString(36).substring(7);
        await registerUser(username, privateKeyString, 10000);
        await api.generate(7);

        let blockChainUser = await api.getUser(username);
        let subTx = new TopUp();
        let inputs = await api.getUTXO(address);
        inputs[0].amount += 1;
        subTx
            .fund(blockChainUser.regtxid, fundingInDuffs, inputs, address)
        subTx.sign(privateKey);
        expect(() => api.sendRawTransaction(subTx.serialize()).to.throw('DAPI RPC error: sendRawTransaction: 400 - "16: bad-txns-in-belowout. Code:-26"'));
    });

    it('Error not throwing when inputs confirmations has been changed when funding', async () => { // TODO WHY?
        let username = Math.random().toString(36).substring(7);
        await registerUser(username, privateKeyString, 10000);
        await api.generate(7);

        let blockChainUser = await api.getUser(username);
        let subTx = new TopUp();
        let inputs = await api.getUTXO(address);
        inputs[0].confirmations += 1;
        subTx
            .fund(blockChainUser.regtxid, fundingInDuffs, inputs, address);
        subTx.sign(privateKey);
        await api.sendRawTransaction(subTx.serialize());
    });


    it('Error not throwing when inputs height has been changed when funding', async () => { // TODO WHY?
        let username = Math.random().toString(36).substring(7);
        await registerUser(username, privateKeyString, 10000);
        await api.generate(7);

        let blockChainUser = await api.getUser(username);
        let subTx = new TopUp();
        let inputs = await api.getUTXO(address);
        inputs[0].height += 1;
        subTx
            .fund(blockChainUser.regtxid, fundingInDuffs, inputs, address);
        subTx.sign(privateKey);
        await api.sendRawTransaction(subTx.serialize());
    });

    it('Error not throwing when inputs scriptPubKey has been changed when funding', async () => { // TODO WHY?
        let username = Math.random().toString(36).substring(7);
        await registerUser(username, privateKeyString, 10000);
        await api.generate(7);

        let blockChainUser = await api.getUser(username);
        let subTx = new TopUp();
        let inputs = await api.getUTXO(address);
        inputs[0].scriptPubKey = '76a914dc2bfda564dc6217c55c842d65cc0242e095d2d788ac';
        subTx
            .fund(blockChainUser.regtxid, fundingInDuffs, inputs, address)
        subTx.sign(privateKey);
        await api.sendRawTransaction(subTx.serialize());
    });


    it('Error not throwing when inputs txid has been changed when funding', async () => { // TODO WHY?
        let username = Math.random().toString(36).substring(7);
        await registerUser(username, privateKeyString, 10000);
        await api.generate(7);

        let blockChainUser = await api.getUser(username);
        let subTx = new TopUp();
        let inputs = await api.getUTXO(address);
        inputs[0].txid = 'a3690bea9fadcba57b3138df56ccfd6e15823071d5e5f43fbbbdf947d0ccbe41';
        subTx
            .fund(blockChainUser.regtxid, fundingInDuffs, inputs, address)
        subTx.sign(privateKey);
        api.sendRawTransaction(subTx.serialize())
    });

});


