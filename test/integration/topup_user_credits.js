'use strict'


var buffer = require('buffer');
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
// let topUpTx;
let privateKey;
let publicKey;
let fundingInDuffs = 1000 * 1000;

const timeout = ms => new Promise(res => setTimeout(res, ms))


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

    it('Sequential funding with signing do not increase number of inputs/outputs', async () => {
        let username = Math.random().toString(36).substring(7);
        await registerUser(username, privateKeyString, 10000);
        await api.generate(7);

        let blockChainUser = await api.getUser(username);
        let nums = [1, 2, 3, 4];
        for (let num of nums) {
            let inputs = await api.getUTXO(address);
            let subTx = new TopUp();
            subTx
                .fund(blockChainUser.regtxid, fundingInDuffs*num, inputs, address);
            expect(subTx).to.be.an('object');
            expect(subTx.inputs).to.have.lengthOf(1);
            expect(subTx.nLockTime).to.equal(0);
            expect(subTx.outputs).to.have.lengthOf(2);
            expect(subTx.version).to.equal(1);
            subTx.sign(privateKey);
            let txId = await api.sendRawTransaction(subTx.serialize());
            expect(txId).to.be.an('object').that.has.all.keys('txid');
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

//TODO add <>667 cases
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
        subTx.fee(100).sign(privateKey)
        expect(() => subTx.serialize()).to.throw('Fee is too small: expected more than 667 but got 100 - For more information please see');
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
            subTx.fee(1000).sign(privateKey)
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
            subTx.fee(2000).sign(privateKey)
            return expect(
                api.sendRawTransaction(subTx.serialize())
            ).to.be.rejectedWith('DAPI RPC error: sendRawTransaction: 400 - "16: bad-subtx-badchange. Code:-26"');
        });

    it('Should throw error when fee is too large', async () => {
        // let testFundingAmount = 10000;
        let username = Math.random().toString(36).substring(7);
        await registerUser(username, privateKeyString, fundingInDuffs);
        await api.generate(7);

        let blockChainUser = await api.getUser(username);
        let subTx = new TopUp();
        let inputs = await api.getUTXO(address);

        await subTx.fund(blockChainUser.regtxid, fundingInDuffs, inputs, address);

        subTx.fee(300000).sign();
        expect(() => subTx.serialize()).to.throw('Fee is too large: expected less than 150000 but got 300000');
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
            .fund(blockChainUser.regtxid, fundingInDuffs, inputs, address)
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
            .fund(blockChainUser.regtxid, fundingInDuffs, inputs, address)
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


