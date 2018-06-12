'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;

const BitcoreLib = require('@dashevo/dashcore-lib');
const {PrivateKey, PublicKey, Address} = BitcoreLib;
const {Registration} = BitcoreLib.Transaction.SubscriptionTransactions;
const Signature = require("@dashevo/dashcore-lib/lib/crypto/signature");

const {execCommand, timeout} = require('./helpers');
const {privateKeyString} = require('../../examples/data');
const Api = require('../../src/api');
const config = require('../../src/config');
config.Api.port = 3000;

let api;

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
    const fundingInDuffs = requestedFunding || 1000 * 1000; // 0.01 Dash

    api.getBalance(address);

    subTx.fund(inputs, address, fundingInDuffs);
    if (skipSign === undefined || !skipSign) {
        await subTx.sign(privateKey, signature == undefined ? undefined : signature);
    }
    // Send registration transaction to the network
    return api.sendRawTransaction(subTx.serialize());
}

describe('async.registerUser', async () => {
    before(async () => {
        api = new Api();

        await execCommand(
            './mn-bootstrap.sh',
            ['regtest', 'up', '-d'],
            {cwd: process.cwd() + '/../mn-bootstrap/'},
        );

        await execCommand(
            './mn-bootstrap.sh',
            ['regtest', 'logs', '-f'],
            {cwd: process.cwd() + '/../mn-bootstrap/'}, 'Dash Daemon Ready');
        await api.generate(101);

        await execCommand(
            './mn-bootstrap.sh',
            ['regtest', 'logs', '-f'],
            {cwd: process.cwd() + '/../mn-bootstrap/'}, 'join new Quorum');
        await api.generate(10);

        await
            execCommand(
                'sh',
                ['dash-cli-without-tty.sh', 'regtest', 'sendtoaddress', 'ygPcCwVy7Fxg7ruxZzqVYdPLtvw7auHAFh', 500],
                {cwd: process.cwd() + '/../mn-bootstrap/'},
            );
        await api.generate(7);
    });

    beforeEach(async () => {
    });

    after(async () => {
    });

    const signatures = [undefined, Signature.SIGHASH_ALL, Signature.SIGHASH_NONE, Signature.SIGHASH_SINGLE, Signature.SIGHASH_ANYONECANPAY];
    // https://dashpay.atlassian.net/browse/EV-901
    // TODO for SIGHASH_ANYONECANPAY:  Error: DAPI RPC error: sendRawTransaction: 400 - "64: non-mandatory-script-verify-flag (Signature hash type missing or not understood). Code:-26"
    signatures.forEach(function (signature) {
        it('Should register user with diff signature', async () => {
            let username = Math.random().toString(36).substring(7);
            await registerUser(username, privateKeyString, 10000, false, signature);

            let blockChainUser = await api.getUserByName(username);

            expect(blockChainUser).to.be.an('object');
            expect(blockChainUser.uname).to.be.a('string');
            expect(blockChainUser.uname).to.equal(username);
            expect(blockChainUser.credits).to.be.a('number');
            expect(blockChainUser.data).to.be.a('string');
            expect(blockChainUser.pubkeyid).to.be.a('string');
            expect(blockChainUser.regtxid).to.be.a('string');
            expect(blockChainUser.state).to.be.a('string');
            expect(blockChainUser.state).to.equal('open');
            expect(blockChainUser.subtx).to.be.a('array');
            expect(blockChainUser.transitions).to.be.a('array');
        });
    });

    it('Should throw Error when requestedFunding too small', async () => {
        let username = Math.random().toString(36).substring(7);
        return expect(registerUser(username, privateKeyString, 1)).to.be.rejectedWith('Dust amount detected in one output - For more information please see');
    });

    it('Should throw Error when requestedFunding = Transaction.DUST_AMOUNT-1', async () => {
        // Minimum amount for an output for it not to be considered a dust output
        // Transaction.DUST_AMOUNT = 5460;
        let username = Math.random().toString(36).substring(7);
        return expect(registerUser(username, privateKeyString, 5459)).to.be.rejectedWith('Dust amount detected in one output - For more information please see');
    });

    it('Should throw Error when requestedFunding = Transaction.DUST_AMOUNT', async () => {
        // Minimum amount for an output for it not to be considered a dust output
        // Transaction.DUST_AMOUNT = 5460;
        let username = Math.random().toString(36).substring(7);
        return expect(registerUser(username, privateKeyString, 5460)).to.be.eventually.rejectedWith('DAPI RPC error: sendRawTransaction: 400 - "16: bad-subtx-lowtopup. Code:-26"');
    });

    it('Should throw Error when requestedFunding = Transaction.DUST_AMOUNT + 1', async () => {
        // Minimum amount for an output for it not to be considered a dust output
        // Transaction.DUST_AMOUNT = 5460;
        let username = Math.random().toString(36).substring(7);
        return expect(registerUser(username, privateKeyString, 5461)).to.be.eventually.rejectedWith('DAPI RPC error: sendRawTransaction: 400 - "16: bad-subtx-lowtopup. Code:-26"');
    });

    it('Should throw Error when requestedFunding = 9999', async () => {
        let username = Math.random().toString(36).substring(7);
        return expect(registerUser(username, privateKeyString, 9999)).to.be.eventually.rejectedWith('DAPI RPC error: sendRawTransaction: 400 - "16: bad-subtx-lowtopup. Code:-26"');
    });

    it('Should throw Error when requestedFunding is too big', async () => {
        let username = Math.random().toString(36).substring(7);
        return expect(registerUser(username, privateKeyString, 900000000000)).to.be.eventually.rejectedWith('undefined - For more information please see');
    });

    [10000, '10000', 10000000].forEach(function (requestedFunding) {
        it('Should register user with correct requestedFunding', async () => {
            let username = Math.random().toString(36).substring(7);

            await registerUser(username, privateKeyString, requestedFunding);

            let blockChainUser = await api.getUserByName(username);

            expect(blockChainUser).to.be.an('object');
            expect(blockChainUser.uname).to.be.a('string');
            expect(blockChainUser.uname).to.equal(username);
            expect(blockChainUser.credits).to.be.a('number');
            expect(blockChainUser.credits).to.equal(parseInt(requestedFunding));
            expect(blockChainUser.data).to.be.a('string');
            expect(blockChainUser.pubkeyid).to.be.a('string');
            expect(blockChainUser.regtxid).to.be.a('string');
            expect(blockChainUser.state).to.be.a('string');
            expect(blockChainUser.state).to.equal('open');
            expect(blockChainUser.subtx).to.be.a('array');
            expect(blockChainUser.transitions).to.be.a('array');
        });
    });

    ["1", '*', '&()@', '[+='].forEach(function (name) {
        it('Should register user with special symbols', async () => {
            let username = name + Math.random().toString(36).substring(7);

            await registerUser(username, privateKeyString);

            let blockChainUser = await api.getUserByName(username);

            expect(blockChainUser).to.be.an('object');
            expect(blockChainUser.uname).to.be.a('string');
            expect(blockChainUser.uname).to.equal(username);
            expect(blockChainUser.credits).to.be.a('number');
            expect(blockChainUser.credits).to.equal(1000000);
            expect(blockChainUser.data).to.be.a('string');
            expect(blockChainUser.pubkeyid).to.be.a('string');
            expect(blockChainUser.regtxid).to.be.a('string');
            expect(blockChainUser.state).to.be.a('string');
            expect(blockChainUser.state).to.equal('open');
            expect(blockChainUser.subtx).to.be.a('array');
            expect(blockChainUser.transitions).to.be.a('array');
        });
    });

    it('Should throw Error when username is with big datalen', async () => {
        return expect(registerUser('a'.repeat(1000), privateKeyString)).to.be.eventually.rejectedWith('DAPI RPC error: sendRawTransaction: 400 - "16: bad-subtx-datalen. Code:-26"');
    });

    it('Should throw Error when create user with existing name and new requestedFunding without confirmation', async () => {
        let username = Math.random().toString(36).substring(7);
        await registerUser(username, privateKeyString, 99999);
        return expect(registerUser(username, privateKeyString)).to.be.eventually.rejectedWith('DAPI RPC error: sendRawTransaction: 400 - "18: subtx-dup-username. Code:-26"');
    });

    it('Should throw Error when recreate user without confirmation', async () => {
        let username = Math.random().toString(36).substring(7);
        await registerUser(username, privateKeyString);
        return expect(registerUser(username, privateKeyString)).to.be.eventually.rejectedWith('DAPI RPC error: sendRawTransaction: 400 - "18: subtx-dup-username. Code:-26');
    });

    it('Should throw Error when prKeyString is wrong( with bigger size)', async () => {
        let username = Math.random().toString(36).substring(7);
        expect(registerUser(username, privateKeyString + 'a')).to.be.eventually.rejectedWith('Checksum mismatch');
    });

    it('Should throw Error when prKeyString is wrong( with smaller size)', async () => {
        let username = Math.random().toString(36).substring(7);
        return expect(registerUser(username, privateKeyString.substring(0, privateKeyString.length - 1))).to.be.eventually.rejectedWith('Checksum mismatch');
    });

    it('Should throw Error when prKeyString is null', async () => {
        let username = Math.random().toString(36).substring(7);
        return expect(registerUser(username)).to.be.eventually.rejectedWith('Invalid state: undefined');
    });

    it('Should throw Error when prKeyString is empty string', async () => {
        let username = Math.random().toString(36).substring(7);
        return expect(registerUser(username, '')).to.be.eventually.rejectedWith('Input string too short');
    });

    it('Should throw Error when prKeyString is number', async () => {
        const username = Math.random().toString(36).substring(7);
        return expect(registerUser(username, 123)).to.be.eventually.rejectedWith('First argument is an unrecognized data type.');
    });

    it('Should not complete registration when sign was skipped', async () => {
        let username = Math.random().toString(36).substring(7);
        return expect(registerUser(username, privateKeyString, 10000, true)).to.be.eventually.rejectedWith('Some inputs have not been fully signed');
    });
});


describe('sync.registerUser', () => {
    before(() => {
        api = new Api();
    });

    it('Should re-register user when sign was skipped in the first time', async () => {
        let username = Math.random().toString(36).substring(7);
        await expect(registerUser(username, privateKeyString, 10000, true)).to.be.eventually.rejectedWith('Some inputs have not been fully signed');
        await api.generate(7);
        await registerUser(username, privateKeyString, 10001);

        let blockChainUser = await api.getUserByName(username);

        expect(blockChainUser).to.be.an('object');
        expect(blockChainUser.uname).to.be.a('string');
        expect(blockChainUser.uname).to.equal(username);
        expect(blockChainUser.credits).to.be.a('number');
        expect(blockChainUser.credits).to.equal(10001);
    });

    it('Should throw Error when recreate user with confirmation', async () => {
        let username = Math.random().toString(36).substring(7);
        await registerUser(username, privateKeyString);
        await api.generate(7);
        await expect(registerUser(username, privateKeyString)).to.be.eventually.rejectedWith('DAPI RPC error: sendRawTransaction: 400 - "16: bad-subtx-dupusername. Code:-26');
    });

    it('Should throw Error when create user with existing name and new requestedFunding with confirmation', async () => {
        let username = Math.random().toString(36).substring(7);
        await timeout(1000);
        registerUser(username, privateKeyString, 99999);
        await api.generate(7);
        let blockChainUser = await api.getUserByName(username);

        expect(blockChainUser).to.be.an('object');
        expect(blockChainUser.uname).to.be.a('string');
        expect(blockChainUser.uname).to.equal(username);
        expect(blockChainUser.credits).to.be.a('number');
        expect(blockChainUser.credits).to.equal(99999);
        // now we try to register user with 1000 * 1000 requestedFunding
        await expect(registerUser(username, privateKeyString)).to.be.eventually.rejectedWith(/DAPI RPC error: sendRawTransaction: 400 - "16: bad-subtx-dupusername. Code:-26|DAPI RPC error: sendRawTransaction: 400 - "18: subtx-dup-username. Code:-26"/);
    });

    it('Should create users with case sensitive names', async () => { // TODO is it True?
        let username = Math.random().toString(36).substring(7);

        for (let un of [username.toLowerCase(), username.toUpperCase()]) {
            await timeout(1000);
            await registerUser(un, privateKeyString);
            await api.generate(7);
        }

        for (let un of [username.toLowerCase(), username.toUpperCase()]) {
            let blockChainUserLower = await api.getUserByName(un);
            expect(blockChainUserLower).to.be.an('object');
            expect(blockChainUserLower.uname).to.be.a('string');
            expect(blockChainUserLower.uname).to.equal(un);
        }
    });

});