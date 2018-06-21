'use strict';

const chai = require('chai');

chai.use(require('chai-as-promised'));
const expect = chai.expect;

const BitcoreLib = require('@dashevo/dashcore-lib');
const Schema = require('@dashevo/dash-schema/lib');
const {PrivateKey, PublicKey, Address} = BitcoreLib;
const {TopUp} = BitcoreLib.Transaction.SubscriptionTransactions;

const {execCommand, timeout, registerUser, registerDap, updateUserState, topUpUserCredits} = require('./helpers');

const {privateKeyString} = require('../../examples/data');
const Api = require('../../src/api');
const config = require('../../src/config');
config.Api.port = 3000;

let api;
let address;
let privateKey;
let publicKey;

describe('sync.topup_user_credits', () => {
    before(async () => {
        privateKey = new PrivateKey(privateKeyString);
        publicKey = PublicKey.fromPrivateKey(privateKey);
        address = Address.fromPublicKey(publicKey, 'testnet').toString();

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
            {cwd: process.cwd() + '/../mn-bootstrap/'}, 'Awaiting full sync before running Sentinel');
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
        await timeout(1000);
    });
    describe('.api.bestBlockHeight', () => {
        it('Should be able to call generate with 0 blocks to generate', async () => {
            let bestBlockHeight = await api.getBestBlockHeight();
            expect(bestBlockHeight).to.be.an('number');
            api.generate(0);
            expect(await api.getBestBlockHeight()).to.equal(bestBlockHeight);

        });

        it('Should be able to call generate with 1 blocks to generate', async () => {
            let bestBlockHeight = await api.getBestBlockHeight();
            expect(bestBlockHeight).to.be.an('number');
            await api.generate(1);
            expect(await api.getBestBlockHeight()).to.equal(bestBlockHeight + 1);

        });

        it('Should be able to call generate with many blocks to generate', async () => {
            let bestBlockHeight = await api.getBestBlockHeight();
            expect(bestBlockHeight).to.be.an('number');
            await api.generate(33);
            expect(await api.getBestBlockHeight()).to.equal(bestBlockHeight + 33);
        });

    });

    describe('.api.getBlockHeaders', () => {
        function verifyHeaders(blockHeaders, prevHashInFirstBlockExists) {
            (blockHeaders.headers).forEach(function (blockHeader) {
                if (blockHeader == blockHeaders.headers[0] && !prevHashInFirstBlockExists) {
                    expect(Object.keys(blockHeader)).to.have.lengthOf(12);
                } else {
                    expect(Object.keys(blockHeader)).to.have.lengthOf(13);
                    expect(blockHeader.prevHash).to.be.an('string');
                }
                expect(blockHeader.bits).to.be.an('string');
                expect(blockHeader.chainWork).to.be.an('string');
                expect(blockHeader.confirmations).to.be.an('number');
                expect(blockHeader.difficulty).to.be.an('number');
                expect(blockHeader.hash).to.be.an('string');
                expect(blockHeader.height).to.be.an('number');
                expect(blockHeader.medianTime).to.be.an('number');
                expect(blockHeader.merkleRoot).to.be.an('string');
                expect(blockHeader.nextHash).to.be.an('string');
                expect(blockHeader.nonce).to.be.an('number');
                expect(blockHeader.time).to.be.an('number');
                expect(blockHeader.version).to.be.an('number');
            });
        }

        it('Should return array of 25 headers when offset=0, limit=0', async () => {
            let blockHeaders = await api.getBlockHeaders(0, 0);
            expect(blockHeaders).to.be.an('object');
            expect(Object.keys(blockHeaders)).to.have.lengthOf(1);
            expect(blockHeaders.headers).to.be.an('array');
            expect(blockHeaders.headers).to.have.lengthOf(25);

            verifyHeaders(blockHeaders, false);
        });

        it('Should return array of 25 headers when offset=0, limit=0', async () => {
            let blockHeaders = await api.getBlockHeaders(0, 0, false);
            expect(blockHeaders).to.be.an('object');
            expect(Object.keys(blockHeaders)).to.have.lengthOf(1);
            expect(blockHeaders.headers).to.be.an('array');
            expect(blockHeaders.headers).to.have.lengthOf(25);

            verifyHeaders(blockHeaders, false);
        });

        it('Should return array of 1 headers when offset=0, limit=1', async () => {
            let blockHeaders = await api.getBlockHeaders(0, 1);
            expect(blockHeaders).to.be.an('object');
            expect(Object.keys(blockHeaders)).to.have.lengthOf(1);
            expect(blockHeaders.headers).to.be.an('array');
            expect(blockHeaders.headers).to.have.lengthOf(1);

            verifyHeaders(blockHeaders, false);
        });

        /*
        // https://dashpay.atlassian.net/browse/EV-927
        it('Should return array of 25 headers when offset=0, limit=250', async () => {
            let blockHeaders = await api.getBlockHeaders(0, 250);
            expect(blockHeaders).to.be.an('object');
            expect(Object.keys(blockHeaders)).to.have.lengthOf(1);
            expect(blockHeaders.headers).to.be.an('array');
            expect(blockHeaders.headers).to.have.lengthOf(1);

            verifyHeaders(blockHeaders, false);
        });
        // https://dashpay.atlassian.net/browse/EV-927
        it('Should return array of 25 headers when offset=0, limit=251', async () => {
            let blockHeaders = await api.getBlockHeaders(0, 251);
            expect(blockHeaders).to.be.an('object');
            expect(Object.keys(blockHeaders)).to.have.lengthOf(1);
            expect(blockHeaders.headers).to.be.an('array');
            expect(blockHeaders.headers).to.have.lengthOf(1);

            verifyHeaders(blockHeaders, false);
        });
        */

        it('Should return array of 25 headers when offset=1, limit=0', async () => {
            let blockHeaders = await api.getBlockHeaders(1, 0);
            expect(blockHeaders).to.be.an('object');
            expect(Object.keys(blockHeaders)).to.have.lengthOf(1);
            expect(blockHeaders.headers).to.be.an('array');
            expect(blockHeaders.headers).to.have.lengthOf(25);

            verifyHeaders(blockHeaders, true);
        });

        it('Should return array of 25 headers when offset=1, limit=25', async () => {
            let blockHeaders = await api.getBlockHeaders(1, 25);
            expect(blockHeaders).to.be.an('object');
            expect(Object.keys(blockHeaders)).to.have.lengthOf(1);
            expect(blockHeaders.headers).to.be.an('array');
            expect(blockHeaders.headers).to.have.lengthOf(25);

            verifyHeaders(blockHeaders, true);
        });

        it('Should throw error when getBlockHeaders without limit parameter', async () => {
            return expect(api.getBlockHeaders(1)).to.be.rejectedWith('DAPI RPC error: getBlockHeaders: params should have required property \'limit\'');
        });

        it('Should throw error when getBlockHeaders without parameters', async () => {
            return expect(api.getBlockHeaders()).to.be.rejectedWith('DAPI RPC error: getBlockHeaders: params should have required property \'limit\'');
        });
    });

    describe('.api.generate', () => {
        it('Should return array of  block hashes', async () => {
            let hashes = await api.generate(13);
            expect(hashes).to.be.an('array');
            expect(hashes).to.have.lengthOf(13);

            hashes.forEach(function (hash) {
                expect(hash).to.be.an('string');
                expect(hash).to.have.lengthOf(64);
            });
        });

        it('Should throw error when num of blocks negative', async () => {
            return expect(api.generate(-1)).to.be.rejectedWith('DAPI RPC error: generate: params.amount should be >= 0');
        });

        it('Should throw error when num of blocks is string', async () => {
            return expect(api.generate('string')).to.be.rejectedWith('DAPI RPC error: generate: params.amount should be integer');
        });

        it('Should throw error when num of blocks is float', async () => {
            return expect(api.generate(1.2)).to.be.rejectedWith('DAPI RPC error: generate: params.amount should be integer');
        });

        it('Should throw error when num of blocks is boolean', async () => {
            return expect(api.generate(true)).to.be.rejectedWith('DAPI RPC error: generate: params.amount should be integer');
        });

        it('Should throw error when num of blocks is array', async () => {
            return expect(api.generate([1])).to.be.rejectedWith('DAPI RPC error: generate: params.amount should be integer');
        });
    });

    describe('.api.searchUsers', () => {
        it('Should be able to searchUsers by name', async () => {
            let username = Math.random().toString(36).substring(7);
            await registerUser(username, privateKeyString, 10000);
            let result = await api.searchUsers(username);
            //TODO add tests after https://dashpay.atlassian.net/browse/EV-761

        });
    });

    describe('.api.searchDapContracts', () => {
        let dashPayId = 'b4de10e1ddb8e225cd04a406deb98e6081f9bd26f98f46c0932d0bdfb2bd0623';
        const user1HDKey = new BitcoreLib.HDPrivateKey();
        const derivingPath = 'm/1';

        function verifyDapContracts(dapContracts, expectedDapname) {
            (dapContracts).forEach(function (dapContract) {
                expect(Object.keys(dapContract)).to.have.lengthOf(1);
                expect(Object.keys(dapContract.dapcontract)).to.have.lengthOf(7);
                expect(dapContract.dapcontract.dapid).to.be.an('string');
                expect(dapContract.dapcontract.dapname).to.be.an('string');
                expect(dapContract.dapcontract.dapname).to.equal(expectedDapname);
                expect(dapContract.dapcontract.dapschema).to.be.an('object');
                expect(dapContract.dapcontract.dapver).to.be.an('string');
                expect(dapContract.dapcontract.dapver).to.equal('');
                expect(dapContract.dapcontract.idx).to.be.an('number');
                expect(dapContract.dapcontract.idx).to.equal(0);
                expect(dapContract.dapcontract.meta).to.be.an('object');
                expect(dapContract.dapcontract.pver).to.be.an('number');
                expect(dapContract.dapcontract.pver).to.equal(1);
            });
        }

        it('Should be able to call generate with 0 blocks to generate', async () => {
            const username = Math.random().toString(36).substring(7);
            await registerUser(username, privateKeyString);
            await api.generate(1);
            let blockchainUser = await api.getUserByName(username);
            const otherUserUsername = Math.random().toString(36).substring(7);
            const otherUserId = await registerUser(otherUserUsername, privateKeyString);
            await topUpUserCredits(blockchainUser.regtxid, privateKeyString);
            await api.generate(1);
            blockchainUser = await api.getUserByName(username);
            // Registering dap, if it's not registered already:
            let dashPayDataContract = await api.getDapContract(dashPayId);
            if (!dashPayDataContract) {
                // DashPay data contract not found. Creating one
                dashPayId = await registerDap(
                    Schema.Daps.DashPay,
                    privateKeyString,
                    blockchainUser.regtxid,
                );
                await api.generate(1);
            }
            const contactRequest = Schema.create.dapobject('contact');
            contactRequest.contact.hdextpubkey = user1HDKey
                .derive(derivingPath).hdPublicKey.toString();
            contactRequest.contact.relation = otherUserId.txid;
            await updateUserState(dashPayId, blockchainUser.regtxid, [contactRequest], privateKeyString);
            await api.generate(1);
            dashPayDataContract = await api.getDapContract(dashPayId);
            let dapContracts = await api.searchDapContracts(dashPayDataContract.dapcontract.dapname);
            expect(dapContracts).to.be.an('array');
            expect(dapContracts).to.have.lengthOf.above(1);
            verifyDapContracts(dapContracts, dashPayDataContract.dapcontract.dapname);

        });
    });


});


