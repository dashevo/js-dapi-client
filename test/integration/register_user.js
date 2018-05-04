'use strict'

const {spawn} = require('child_process');
const Signature = require("@dashevo/dashcore-lib/lib/crypto/signature");

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
const expect = chai.expect;

const BitcoreLib = require('@dashevo/dashcore-lib');
const {privateKeyString} = require('../../examples/data');
const Api = require('../../src/api');
const {PrivateKey, PublicKey, Address} = BitcoreLib;
const {Registration} = BitcoreLib.Transaction.SubscriptionTransactions;

const config = require('../../src/config');

config.Api.port = 3000;

let api;

const privateKey = new PrivateKey(privateKeyString);

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

    const balance = await api.getBalance(address);

    subTx.fund(inputs, address, fundingInDuffs);
    if (skipSign === undefined || !skipSign) {
        subTx.sign(privateKey, signature == undefined ? undefined : signature);
    }
    // Send registration transaction to the network
    return api.sendRawTransaction(subTx.serialize());
}


function execCommand (command, params, options) {
  return new Promise(resolve => {
    let result = '';
    const sp = spawn(command, params, options);

    sp.stdout.on('data', data => {
      console.log(`stdout: ${data}`);
      result += data;
    });

    sp.stderr.on('data', data => {
      console.log(`stderr: ${data}`);
      result += data;
    });

    sp.on('close', code => {
      console.log(`child process exited with code ${code}`);
      resolve(result)
    });
  });
}


describe('async.registerUser', async () => {
    before(async () => {
        // Need to start mn-bootstrap
        api = new Api();

        // Initial chain
        await api.generate(101);
        const result = await execCommand(
            'sh',
            ['dash-cli-without-tty.sh', 'regtest', 'sendtoaddress', 'ygPcCwVy7Fxg7ruxZzqVYdPLtvw7auHAFh', 500],
            {cwd: process.cwd() + '/../mn-bootstrap/'},
        );
        console.log(result);
        await api.generate(7);
    });

    beforeEach(async () => {
    });

    after(async () => {
    });

    var signatures = [undefined, Signature.SIGHASH_ALL, Signature.SIGHASH_NONE, Signature.SIGHASH_SINGLE, Signature.SIGHASH_ANYONECANPAY];
    // for SIGHASH_ANYONECANPAY:  Error: DAPI RPC error: sendRawTransaction: 400 - "64: non-mandatory-script-verify-flag (Signature hash type missing or not understood). Code:-26"
    signatures.forEach(function (signature) {
        it('Should register user with diff signature', async () => {
            let username = Math.random().toString(36).substring(7);
            await registerUser(username, privateKeyString, 10000, false, signature);

            let blockChainUser = await api.getUser(username);

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


    it('Should throw Error when requestedFunding is a string', async () => {
        let username = Math.random().toString(36).substring(7);
        return expect(registerUser(username, privateKeyString, 'blabla')).to.be.eventually.rejectedWith('Invalid state: Output satoshis is not a natural number');
    });

    it('Should throw Error when requestedFunding is a boolean', async () => {
        let username = Math.random().toString(36).substring(7);
        return expect(registerUser(username, privateKeyString, true)).to.be.eventually.rejectedWith('Invalid Argument: Output satoshis is not a natural number');
    });

    it('Should throw Error when requestedFunding is too big', async () => {
        let username = Math.random().toString(36).substring(7);
        return expect(registerUser(username, privateKeyString, 900000000000)).to.be.eventually.rejectedWith('undefined - For more information please see');
    });

    var requestedFundings = [10000, '10000', 10000000]
    requestedFundings.forEach(function (requestedFunding) {
        it('Should register user with correct requestedFunding', async () => {
            let username = Math.random().toString(36).substring(7);

            await registerUser(username, privateKeyString, requestedFunding);

            let blockChainUser = await api.getUser(username);

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

    var names = ["1", '*', '&()@', '[+=']
    names.forEach(function (name) {
        it('Should register user with special symbols', async () => {
            let username = name + Math.random().toString(36).substring(7);

            await registerUser(username, privateKeyString);

            let blockChainUser = await api.getUser(username);

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

    it('Should throw Error when username is empty', async () => {
        return expect(registerUser('', privateKeyString)).to.be.eventually.rejectedWith('DAPI RPC error: sendRawTransaction: 400 - "16: bad-subtx-dupusername. Code:-26"');
    });

    it('Should throw Error when username is number', async () => {
        return expect(registerUser(123, privateKeyString)).to.be.eventually.rejectedWith('The "value" argument must not be of type number. Received type number');
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

    it('Should throw Error when privateKey is wrong( with bigger size)', async () => {
        let username = Math.random().toString(36).substring(7);
        expect(registerUser(username, privateKeyString + 'a')).to.be.eventually.rejectedWith('Checksum mismatch');
    });

    it('Should throw Error when privateKey is wrong( with smaller size)', async () => {
        let username = Math.random().toString(36).substring(7);
        return expect(registerUser(username, privateKeyString.substring(0, privateKeyString.length - 1))).to.be.eventually.rejectedWith('Checksum mismatch');
    });

    it('Should throw Error when privateKey is null', async () => {
        let username = Math.random().toString(36).substring(7);
        return expect(registerUser(username)).to.be.eventually.rejectedWith('Invalid state: undefined');
    });

    it('Should throw Error when privateKey is empty string', async () => {
        let username = Math.random().toString(36).substring(7);
        return expect(registerUser(username, '')).to.be.eventually.rejectedWith('Input string too short');
    });

    it('Should throw Error when privateKey is number', async () => {
        const username = Math.random().toString(36).substring(7);
        return expect(registerUser(username, 123)).to.be.eventually.rejectedWith('First argument is an unrecognized data type.');
    });

    it('Should not complete registration when sign was skipped', async () => {
        let username = Math.random().toString(36).substring(7);
        return expect(registerUser(username, privateKeyString, 10000, true)).to.be.eventually.rejectedWith('Some inputs have not been fully signed');
    });
});

describe('sync.registerUser', () => {
    it('Should re-register user when sign was skipped in the first time', async () => {
        let username = Math.random().toString(36).substring(7);
        await expect(registerUser(username, privateKeyString, 10000, true)).to.be.eventually.rejectedWith('Some inputs have not been fully signed');
        await api.generate(7);
        await registerUser(username, privateKeyString, 10001);

        let blockChainUser = await api.getUser(username);

        expect(blockChainUser).to.be.an('object');
        expect(blockChainUser.uname).to.be.a('string');
        expect(blockChainUser.uname).to.equal(username);
        expect(blockChainUser.credits).to.be.a('number');
        await expect(blockChainUser.credits).to.equal(10001);
    });

    it('Should throw Error when recreate user with confirmation', async () => {
        let username = Math.random().toString(36).substring(7);
        await registerUser(username, privateKeyString);
        await api.generate(7);
        await expect(registerUser(username, privateKeyString)).to.be.eventually.rejectedWith('DAPI RPC error: sendRawTransaction: 400 - "16: bad-subtx-dupusername. Code:-26');
    });
    it('Should throw Error when create user with existing name and new requestedFunding with confirmation', async () => {
        let username = Math.random().toString(36).substring(7);
        const a = await registerUser(username, privateKeyString, 99999);
        await api.generate(7)
        let blockChainUser = await api.getUser(username);

        expect(blockChainUser).to.be.an('object');
        expect(blockChainUser.uname).to.be.a('string');
        expect(blockChainUser.uname).to.equal(username);
        expect(blockChainUser.credits).to.be.a('number');
        expect(blockChainUser.credits).to.equal(99999);
        await expect(registerUser(username, privateKeyString)).to.be.eventually.rejectedWith('DAPI RPC error: sendRawTransaction: 400 - "16: bad-subtx-dupusername. Code:-26');
    });

    it('Should create users with case sensitive names', async () => { // TODO is it True?
        let username = Math.random().toString(36).substring(7);
        await registerUser(username.toLowerCase(), privateKeyString);
        await api.generate(7);
        await registerUser(username.toUpperCase(), privateKeyString);
        await api.generate(7);

        let blockChainUserLower = await api.getUser(username.toLowerCase());
        expect(blockChainUserLower).to.be.an('object');
        expect(blockChainUserLower.uname).to.be.a('string');
        await expect(blockChainUserLower.uname).to.equal(username.toLowerCase());

        let blockChainUserUpper = await api.getUser(username.toUpperCase());
        expect(blockChainUserUpper).to.be.an('object');
        expect(blockChainUserUpper.uname).to.be.a('string');
        await expect(blockChainUserUpper.uname).to.equal(username.toUpperCase());
    });

});