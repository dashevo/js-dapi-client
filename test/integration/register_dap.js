'use strict'

const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;

const Schema = require('@dashevo/dash-schema/lib');
const BitcoreLib = require('@dashevo/dashcore-lib');

const user1HDKey = new BitcoreLib.HDPrivateKey();
const user2HDKey = new BitcoreLib.HDPrivateKey();
const {PrivateKey, PublicKey, Address} = BitcoreLib;

const {privateKeyString} = require('../../examples/data');
const {execCommand, timeout, registerUser, registerDap, updateUserState, topUpUserCredits} = require('./helpers');
const config = require('../../src/config');
const Api = require('../../src/api');

config.Api.port = 3000;
const derivingPath = 'm/1';
const log = console;

let api;
let address;
let privateKey;
let publicKey;
let dashPayId = 'b4de10e1ddb8e225cd04a406deb98e6081f9bd26f98f46c0932d0bdfb2bd0623';


describe('sync.register_dap', () => {
    before(async () => {
        // Need to start mn-bootstrap
        privateKey = new PrivateKey(privateKeyString);
        publicKey = PublicKey.fromPrivateKey(privateKey);
        address = Address.fromPublicKey(publicKey, 'testnet').toString();

        // // Need to start mn-bootstrap & wait wallet loading complete
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
        await timeout(1000);
    });

    it('Should be able to accept 2 contact requests at the same time', async () => {
        const username = Math.random().toString(36).substring(7);
        await registerUser(username, privateKeyString);

        const username2 = Math.random().toString(36).substring(7);
        await registerUser(username2, privateKeyString);

        const otherUserUsername = Math.random().toString(36).substring(7);
        const otherUserId = await registerUser(otherUserUsername, privateKeyString);

        await api.generate(1);

        let blockchainUser = await api.getUser(username);
        let blockchainUser2 = await api.getUser(username2);

        // To up user credits
        await topUpUserCredits(blockchainUser.regtxid, privateKeyString);
        await topUpUserCredits(blockchainUser2.regtxid, privateKeyString);

        await api.generate(1);

        blockchainUser = await api.getUser(username);
        blockchainUser2 = await api.getUser(username2);

        // Registering dap, if it's not registered already:
        let dashPayDataContract = await api.getDapContract(dashPayId);
        if (!dashPayDataContract) {
            log.info('DashPay data contract not found. Creating one');
            dashPayId = await registerDap(
                Schema.Daps.DashPay,
                privateKeyString,
                blockchainUser.regtxid,
            );
            await api.generate(1);
            dashPayDataContract = await api.getDapContract(dashPayId);
        } else {
            log.info('DashPay contract is already created. No need to create one');
        }

        let dashPayId2 = await registerDap(
            Schema.Daps.DashPay,
            privateKeyString,
            blockchainUser2.regtxid,
        );
        await api.generate(1);
        let dashPayDataContract2 = await api.getDapContract(dashPayId2);

        // This code is DashPay-specific.
        const contactRequest = Schema.create.dapobject('contact');
        contactRequest.contact.hdextpubkey = user1HDKey
            .derive(derivingPath).hdPublicKey.toString();
        contactRequest.contact.relation = otherUserId.txid;

        const contactRequest2 = Schema.create.dapobject('contact');
        contactRequest2.contact.hdextpubkey = user1HDKey
            .derive(derivingPath).hdPublicKey.toString();
        contactRequest2.contact.relation = otherUserId.txid;

        log.info('Sending contact request to the network');
        await updateUserState(dashPayId, blockchainUser.regtxid, [contactRequest], privateKeyString);
        await updateUserState(dashPayId, blockchainUser2.regtxid, [contactRequest2], privateKeyString);

        await api.generate(1);

        const user2Context = await api.getUserDapContext(dashPayId, otherUserId.txid);

        expect(user2Context.dapid).to.equal(dashPayId);
        expect(user2Context.maxidx).to.equal(-1);
        expect(user2Context.objects).to.equal(null);
        expect(user2Context.related).to.have.lengthOf(2);
        expect(user2Context.related[0]).to.be.deep.equal({
            "contact": {
                "act": 1,
                "idx": 0,
                "rev": 0,
                "relation": otherUserId.txid,
                "hdextpubkey": contactRequest.contact.hdextpubkey,
                "meta": {
                    "uid": blockchainUser.regtxid,
                    "uname": username
                }
            }
        });
        expect(user2Context.related[1]).to.be.deep.equal({
            "contact": {
                "act": 1,
                "idx": 0,
                "rev": 0,
                "relation": otherUserId.txid,
                "hdextpubkey": contactRequest.contact.hdextpubkey,
                "meta": {
                    "uid": blockchainUser2.regtxid,
                    "uname": username2
                }
            }
        });

        // Now we need to accept first user contact request, i.e. create contact object
        // on second user side, referencing first user's id:
        const contactAcceptance = Schema.create.dapobject('contact');
        contactAcceptance.contact.hdextpubkey = user2HDKey
            .derive(derivingPath).hdPublicKey.toString();
        contactAcceptance.contact.relation = blockchainUser.regtxid;

        const contactAcceptance2 = Schema.create.dapobject('contact');
        contactAcceptance2.contact.hdextpubkey = user2HDKey
            .derive(derivingPath).hdPublicKey.toString();
        contactAcceptance2.contact.relation = blockchainUser2.regtxid;

        await updateUserState(dashPayId, otherUserId.txid, [contactAcceptance, contactAcceptance2], privateKeyString);

        await api.generate(1);

        let user1Space = await api.getUserDapSpace(dashPayId, blockchainUser.regtxid);
        expect(user1Space.objects[0]).to.be.deep.equal({
            "contact": {
                "act": 1,
                "idx": 0,
                "rev": 0,
                "relation": otherUserId.txid,
                "hdextpubkey": contactRequest.contact.hdextpubkey
            }
        });

        let user1Space2 = await api.getUserDapSpace(dashPayId, blockchainUser2.regtxid);
        expect(user1Space2.objects[0]).to.be.deep.equal({
            "contact": {
                "act": 1,
                "idx": 0,
                "rev": 0,
                "relation": otherUserId.txid,
                "hdextpubkey": contactRequest2.contact.hdextpubkey
            }
        });

        const user2Space = await api.getUserDapSpace(dashPayId, otherUserId.txid);
        expect(user2Space.dapid).to.equal(dashPayId);
        expect(user2Space.uid).to.equal(otherUserId.txid);
        expect(user2Space.objects).to.have.lengthOf(2);
        expect(user2Space.objects[0]).to.be.deep.equal({
            "contact":
                {
                    "act": 1,
                    "idx": 0,
                    "rev": 0,
                    "relation": user1Space.uid,
                    "hdextpubkey": contactAcceptance.contact.hdextpubkey
                }
        });
        expect(user2Space.objects[1]).to.be.deep.equal({
            "contact":
                {
                    "act": 1,
                    "idx": 0,
                    "rev": 0,
                    "relation": user1Space2.uid,
                    "hdextpubkey": contactAcceptance2.contact.hdextpubkey
                }
        });
    });

    it('Should be able to send 2 contact requests to diff users at the same time', async () => {
        const username = Math.random().toString(36).substring(7);
        await registerUser(username, privateKeyString);
        await api.generate(1);

        let blockchainUser = await api.getUser(username);

        // Registering second user, which we will use later in this example
        const otherUserUsername = Math.random().toString(36).substring(7);
        const otherUserId = await registerUser(otherUserUsername, privateKeyString);

        const thirdUserUsername = Math.random().toString(36).substring(7);
        const thirdUserId = await registerUser(thirdUserUsername, privateKeyString);

        // To up user credits
        await topUpUserCredits(blockchainUser.regtxid, privateKeyString);

        await api.generate(1);

        // Registering dap, if it's not registered already:
        let dashPayDataContract = await api.getDapContract(dashPayId);

        if (!dashPayDataContract) {
            dashPayId = await registerDap(
                Schema.Daps.DashPay,
                privateKeyString,
                blockchainUser.regtxid,
            );
            await api.generate(1);
            dashPayDataContract = await api.getDapContract(dashPayId);
        } else {
            log.info('DashPay contract is already created. No need to create one');
        }

        const contactRequest = Schema.create.dapobject('contact');
        contactRequest.contact.hdextpubkey = user1HDKey
            .derive(derivingPath).hdPublicKey.toString();
        contactRequest.contact.relation = otherUserId.txid;

        const contactRequest2 = Schema.create.dapobject('contact');
        contactRequest2.contact.hdextpubkey = user1HDKey
            .derive(derivingPath).hdPublicKey.toString();
        contactRequest2.contact.relation = thirdUserId.txid;

        // End of DashPay-specific code.
        await updateUserState(dashPayId, blockchainUser.regtxid, [contactRequest, contactRequest2], privateKeyString);

        await api.generate(1);

        let user1Space = await api.getUserDapSpace(dashPayId, blockchainUser.regtxid);

        const user2Context = await api.getUserDapContext(dashPayId, otherUserId.txid);
        expect(user2Context.dapid).to.equal(dashPayId);
        expect(user2Context.maxidx).to.equal(-1);
        expect(user2Context.objects).to.equal(null);
        expect(user2Context.related).to.have.lengthOf(1);
        expect(user2Context.related[0]).to.be.deep.equal({
            "contact": {
                "act": 1,
                "idx": 0,
                "rev": 0,
                "relation": otherUserId.txid,
                "hdextpubkey": contactRequest.contact.hdextpubkey,
                "meta": {
                    "uid": blockchainUser.regtxid,
                    "uname": username
                }
            }
        });

        const contactAcceptance = Schema.create.dapobject('contact');
        contactAcceptance.contact.hdextpubkey = user2HDKey
            .derive(derivingPath).hdPublicKey.toString();
        contactAcceptance.contact.relation = blockchainUser.regtxid;

        await updateUserState(dashPayId, otherUserId.txid, [contactAcceptance], privateKeyString);
        await api.generate(1);

        user1Space = await api.getUserDapSpace(dashPayId, blockchainUser.regtxid);
        expect(user1Space.objects[0]).to.be.deep.equal({
            "contact": {
                "act": 1,
                "idx": 0,
                "rev": 0,
                "relation": otherUserId.txid,
                "hdextpubkey": contactRequest.contact.hdextpubkey
            }
        });

        const user2Space = await api.getUserDapSpace(dashPayId, otherUserId.txid);
        expect(user2Space.dapid).to.equal(dashPayId);
        expect(user2Space.uid).to.equal(otherUserId.txid);
        expect(user2Space.objects).to.have.lengthOf(1);
        expect(user2Space.objects[0]).to.be.deep.equal({
            "contact":
                {
                    "act": 1,
                    "idx": 0,
                    "rev": 0,
                    "relation": user1Space.uid,
                    "hdextpubkey": contactAcceptance.contact.hdextpubkey
                }
        });
    });


    it('Should not be able to register DAP twice', async () => {
        const username = Math.random().toString(36).substring(7);
        await registerUser(username, privateKeyString);

        await api.generate(1);

        let blockchainUser = await api.getUser(username);

        const otherUserUsername = Math.random().toString(36).substring(7);
        await registerUser(otherUserUsername, privateKeyString);

        await topUpUserCredits(blockchainUser.regtxid, privateKeyString);

        await api.generate(1);

        blockchainUser = await api.getUser(username);

        await registerDap(
            Schema.Daps.DashPay,
            privateKeyString,
            blockchainUser.regtxid,
        );
        await api.generate(1);

        // try to register DAP in second time
        return expect(registerDap(
            Schema.Daps.DashPay,
            privateKeyString,
            blockchainUser.regtxid,
        )).to.be.rejectedWith('not valid. state: bad-ts-ancestor (code 81)');
    });


    it('Should not be able to accept contact request twice', async () => {
        const username = Math.random().toString(36).substring(7);
        await registerUser(username, privateKeyString);

        await api.generate(1);
        let blockchainUser = await api.getUser(username);

        const otherUserUsername = Math.random().toString(36).substring(7);
        const otherUserId = await registerUser(otherUserUsername, privateKeyString);

        await topUpUserCredits(blockchainUser.regtxid, privateKeyString);

        await api.generate(1);

        blockchainUser = await api.getUser(username);

        // Registering dap, if it's not registered already:
        let dashPayDataContract = await api.getDapContract(dashPayId);
        if (!dashPayDataContract) {
            dashPayId = await registerDap(
                Schema.Daps.DashPay,
                privateKeyString,
                blockchainUser.regtxid,
            );
            await api.generate(1);
            dashPayDataContract = await api.getDapContract(dashPayId);
        } else {
            log.info('DashPay contract is already created. No need to create one');
        }

        const contactRequest = Schema.create.dapobject('contact');
        contactRequest.contact.hdextpubkey = user1HDKey
            .derive(derivingPath).hdPublicKey.toString();
        contactRequest.contact.relation = otherUserId.txid;

        // End of DashPay-specific code.
        await updateUserState(dashPayId, blockchainUser.regtxid, [contactRequest], privateKeyString);

        await api.generate(1);

        let user1Space = await api.getUserDapSpace(dashPayId, blockchainUser.regtxid);

        const user2Context = await api.getUserDapContext(dashPayId, otherUserId.txid);

        expect(user2Context.dapid).to.equal(dashPayId);
        expect(user2Context.maxidx).to.equal(-1);
        expect(user2Context.objects).to.equal(null);
        expect(user2Context.related).to.have.lengthOf(1);
        expect(user2Context.related[0]).to.be.deep.equal({
            "contact": {
                "act": 1,
                "idx": 0,
                "rev": 0,
                "relation": otherUserId.txid,
                "hdextpubkey": contactRequest.contact.hdextpubkey,
                "meta": {
                    "uid": blockchainUser.regtxid,
                    "uname": username
                }
            }
        });

        const contactAcceptance = Schema.create.dapobject('contact');
        contactAcceptance.contact.hdextpubkey = user2HDKey
            .derive(derivingPath).hdPublicKey.toString();
        contactAcceptance.contact.relation = blockchainUser.regtxid;

        await updateUserState(dashPayId, otherUserId.txid, [contactAcceptance], privateKeyString);
        await api.generate(1);
        return expect(updateUserState(dashPayId, otherUserId.txid, [contactAcceptance], privateKeyString)).to.be.rejectedWith('DAPI RPC error: sendRawTransition: Wasn\'t able to pin packet');
    });

    it('Should trow error when request contact has been resend after accepting', async () => {
        const username = Math.random().toString(36).substring(7);
        await registerUser(username, privateKeyString);

        await api.generate(1);

        let blockchainUser = await api.getUser(username);

        const otherUserUsername = Math.random().toString(36).substring(7);
        const otherUserId = await registerUser(otherUserUsername, privateKeyString);

        await topUpUserCredits(blockchainUser.regtxid, privateKeyString);

        await api.generate(1);

        blockchainUser = await api.getUser(username);

        // Registering dap, if it's not registered already:
        let dashPayDataContract = await api.getDapContract(dashPayId);
        if (!dashPayDataContract) {
            dashPayId = await registerDap(
                Schema.Daps.DashPay,
                privateKeyString,
                blockchainUser.regtxid,
            );
            await api.generate(1);
            dashPayDataContract = await api.getDapContract(dashPayId);
        } else {
            log.info('DashPay contract is already created. No need to create one');
        }

        const contactRequest = Schema.create.dapobject('contact');
        contactRequest.contact.hdextpubkey = user1HDKey
            .derive(derivingPath).hdPublicKey.toString();
        contactRequest.contact.relation = otherUserId.txid;

        await updateUserState(dashPayId, blockchainUser.regtxid, [contactRequest], privateKeyString);

        await api.generate(1);

        let user1Space = await api.getUserDapSpace(dashPayId, blockchainUser.regtxid);

        const user2Context = await api.getUserDapContext(dashPayId, otherUserId.txid);

        expect(user2Context.dapid).to.equal(dashPayId);
        expect(user2Context.maxidx).to.equal(-1);
        expect(user2Context.objects).to.equal(null);
        expect(user2Context.related).to.have.lengthOf(1);
        expect(user2Context.related[0]).to.be.deep.equal({
            "contact": {
                "act": 1,
                "idx": 0,
                "rev": 0,
                "relation": otherUserId.txid,
                "hdextpubkey": contactRequest.contact.hdextpubkey,
                "meta": {
                    "uid": blockchainUser.regtxid,
                    "uname": username
                }
            }
        });

        blockchainUser = await api.getUser(username);
        const contactRequest2 = Schema.create.dapobject('contact');
        contactRequest2.contact.hdextpubkey = user1HDKey
            .derive(derivingPath).hdPublicKey.toString();
        contactRequest2.contact.relation = otherUserId.txid;

        await api.generate(1);
        return expect(updateUserState(dashPayId, blockchainUser.regtxid, [contactRequest2], privateKeyString)).to.be.rejectedWith('DAPI RPC error: sendRawTransition: Wasn\'t able to pin packet');
    });


    it('Should not be able send request twice', async () => {
        const username = Math.random().toString(36).substring(7);
        await registerUser(username, privateKeyString);

        await api.generate(1);

        let blockchainUser = await api.getUser(username);

        const otherUserUsername = Math.random().toString(36).substring(7);
        const otherUserId = await registerUser(otherUserUsername, privateKeyString);

        await topUpUserCredits(blockchainUser.regtxid, privateKeyString);

        await api.generate(1);

        blockchainUser = await api.getUser(username);

        let dashPayDataContract = await api.getDapContract(dashPayId);
        if (!dashPayDataContract) {
            dashPayId = await registerDap(
                Schema.Daps.DashPay,
                privateKeyString,
                blockchainUser.regtxid,
            );
            await api.generate(1);
            dashPayDataContract = await api.getDapContract(dashPayId);
        } else {
            log.info('DashPay contract is already created. No need to create one');
        }

        const contactRequest = Schema.create.dapobject('contact');
        contactRequest.contact.hdextpubkey = user1HDKey
            .derive(derivingPath).hdPublicKey.toString();
        contactRequest.contact.relation = otherUserId.txid;
        contactRequest.contact.extrapropboolean = true;
        contactRequest.contact.extrapropstr = 'stringgg';
        contactRequest.contact.extrapropnum = -1;

        await updateUserState(dashPayId, blockchainUser.regtxid, [contactRequest], privateKeyString);
        await api.generate(1);
        return expect(updateUserState(dashPayId, blockchainUser.regtxid, [contactRequest], privateKeyString)).to.be.rejectedWith('DAPI RPC error: sendRawTransition: Wasn\'t able to pin packet');

    });


    it('Should go through full accepting contact request process with extra properties', async () => {
        const username = Math.random().toString(36).substring(7);
        await registerUser(username, privateKeyString);

        await api.generate(1);

        let blockchainUser = await api.getUser(username);

        const otherUserUsername = Math.random().toString(36).substring(7);
        const otherUserId = await registerUser(otherUserUsername, privateKeyString);

        // To up user credits
        await topUpUserCredits(blockchainUser.regtxid, privateKeyString);

        await api.generate(1);

        blockchainUser = await api.getUser(username);

        let dashPayDataContract = await api.getDapContract(dashPayId);
        if (!dashPayDataContract) {
            dashPayId = await registerDap(
                Schema.Daps.DashPay,
                privateKeyString,
                blockchainUser.regtxid,
            );
            await api.generate(1);
            dashPayDataContract = await api.getDapContract(dashPayId);
        } else {
            log.info('DashPay contract is already created. No need to create one');
        }

        const contactRequest = Schema.create.dapobject('contact');
        contactRequest.contact.hdextpubkey = user1HDKey
            .derive(derivingPath).hdPublicKey.toString();
        contactRequest.contact.relation = otherUserId.txid;
        contactRequest.contact.extrapropboolean = true;
        contactRequest.contact.extrapropstr = 'stringgg';
        contactRequest.contact.extrapropnum = -1;

        await updateUserState(dashPayId, blockchainUser.regtxid, [contactRequest], privateKeyString);

        await api.generate(1);

        let user1Space = await api.getUserDapSpace(dashPayId, blockchainUser.regtxid);

        const user2Context = await api.getUserDapContext(dashPayId, otherUserId.txid);

        expect(user2Context.dapid).to.equal(dashPayId);
        expect(user2Context.maxidx).to.equal(-1);
        expect(user2Context.objects).to.equal(null);
        expect(user2Context.related).to.have.lengthOf(1);
        expect(user2Context.related[0]).to.be.deep.equal({
            "contact": {
                "act": 1,
                "extrapropboolean": true,
                "extrapropnum": -1,
                "extrapropstr": "stringgg",
                "idx": 0,
                "rev": 0,
                "relation": otherUserId.txid,
                "hdextpubkey": contactRequest.contact.hdextpubkey,
                "meta": {
                    "uid": blockchainUser.regtxid,
                    "uname": username
                }
            }
        });

        const contactAcceptance = Schema.create.dapobject('contact');
        contactAcceptance.contact.hdextpubkey = user2HDKey
            .derive(derivingPath).hdPublicKey.toString();
        contactAcceptance.contact.relation = blockchainUser.regtxid;

        await updateUserState(dashPayId, otherUserId.txid, [contactAcceptance], privateKeyString);

        await api.generate(1);

        user1Space = await api.getUserDapSpace(dashPayId, blockchainUser.regtxid);

        expect(user1Space.objects[0]).to.be.deep.equal({
            "contact": {
                "act": 1,
                "extrapropboolean": true,
                "extrapropnum": -1,
                "extrapropstr": "stringgg",
                "idx": 0,
                "rev": 0,
                "relation": otherUserId.txid,
                "hdextpubkey": contactRequest.contact.hdextpubkey
            }
        });

        const user2Space = await api.getUserDapSpace(dashPayId, otherUserId.txid);

        expect(user2Space.dapid).to.equal(dashPayId);
        expect(user2Space.uid).to.equal(otherUserId.txid);
        expect(user2Space.objects).to.have.lengthOf(1);
        expect(user2Space.objects[0]).to.be.deep.equal({
            "contact":
                {
                    "act": 1,
                    "idx": 0,
                    "rev": 0,
                    "relation": user1Space.uid,
                    "hdextpubkey": contactAcceptance.contact.hdextpubkey
                }
        });
    });

    it('Should go through full accepting contact request process', async () => {
        // Generating random username
        const username = Math.random().toString(36).substring(7);
        log.info('Your random username for this run is:');
        log.info(username);
        // Sending registration to the network
        // Note: in this example we assume that account owner is the same
        // person who funds registration, so only one private key is used.
        // Otherwise, owner should create registration transaction and
        // sign it with his own private key, and then pass it to the
        // funder, which will also sign this transaction with his key.
        await registerUser(username, privateKeyString);

        // Caution: this will work only in regtest mode.
        log.info('Mining block to confirm transaction.');
        log.info('Block hash is', await api.generate(1));

        // Checking user data
        let blockchainUser = await api.getUser(username);
        log.info('User profile:', blockchainUser);

        // Registering second user, which we will use later in this example
        const otherUserUsername = Math.random().toString(36).substring(7);
        const otherUserId = await registerUser(otherUserUsername, privateKeyString);
        log.info('Second user is', otherUserUsername, otherUserId);

        // To up user credits
        await topUpUserCredits(blockchainUser.regtxid, privateKeyString);

        // Caution: this will work only in regtest mode.
        log.info('Mining block to confirm transaction.');
        log.info('Block hash is', await api.generate(1));

        // Check user data
        blockchainUser = await api.getUser(username);
        log.info('User credits after top up:', blockchainUser.credits);

        // Registering dap, if it's not registered already:
        let dashPayDataContract = await api.getDapContract(dashPayId);

        if (!dashPayDataContract) {
            log.info('DashPay data contract not found. Creating one');
            dashPayId = await registerDap(
                Schema.Daps.DashPay,
                privateKeyString,
                blockchainUser.regtxid,
            );
            log.info('dashPayId:', dashPayId);
            // Confirming dap contract creation on-chain
            await api.generate(1);
            // Checking if it's really created
            dashPayDataContract = await api.getDapContract(dashPayId);
        } else {
            log.info('DashPay contract is already created. No need to create one');
        }

        log.info('DashPay data contract:');
        log.info(dashPayDataContract);

        // This code is DashPay-specific.

        log.info(`Creating friend request from ${username} to ${otherUserUsername}`);
        // Creating "contact" object
        const contactRequest = Schema.create.dapobject('contact');
        // Generate an HD public key for the user
        contactRequest.contact.hdextpubkey = user1HDKey
            .derive(derivingPath).hdPublicKey.toString();
        // Setting a relation to that user in object. Later this user can retrieve this object
        // from DAPI with getDapContext
        contactRequest.contact.relation = otherUserId.txid;
        log.info('Contact request object:');
        log.info(contactRequest);

        // End of DashPay-specific code.

        log.info('Sending contact request to the network');
        await updateUserState(dashPayId, blockchainUser.regtxid, [contactRequest], privateKeyString);

        log.info('Mining block to confirm changes');
        // Generate 1 block to confirm transition
        await api.generate(1);

        // Check first user dap space - contact request should appear there:

        let user1Space = await api.getUserDapSpace(dashPayId, blockchainUser.regtxid);
        log.info(`${username}'s DashPay dap space:`);
        log.info(user1Space);
        log.info('Contact request in the first user\'s space:');
        log.info(user1Space.objects[0]);

        // Check second user dap context - friend request should appear there:

        // NOTE: If you get error around this line that says 'Cannot read property...'
        // You probably has different users stored in virtual dashdrive and dashcore.
        // It can happen if you flushed regtest data in dashcore, but not in virtual dashdrive.
        // To fix this, go to DAPI folder and delete vmn/stack-db.json
        const user2Context = await api.getUserDapContext(dashPayId, otherUserId.txid);
        log.info(`${otherUserUsername}'s DahPay dap context:`);
        log.info(user2Context);
        log.info('Contact request in the second user\'s space:');
        log.info(user2Context.related[0]);

        expect(user2Context.dapid).to.equal(dashPayId);
        expect(user2Context.maxidx).to.equal(-1);
        expect(user2Context.objects).to.equal(null);
        expect(user2Context.related).to.have.lengthOf(1);
        expect(user2Context.related[0]).to.be.deep.equal({
            "contact": {
                "act": 1,
                "idx": 0,
                "rev": 0,
                "relation": otherUserId.txid,
                "hdextpubkey": contactRequest.contact.hdextpubkey,
                "meta": {
                    "uid": blockchainUser.regtxid,
                    "uname": username
                }
            }
        });

        // Now we need to accept first user contact request, i.e. create contact object
        // on second user side, referencing first user's id:

        log.info(`Accepting contact request from ${otherUserUsername} by ${username}`);
        // Creating "contact" object
        const contactAcceptance = Schema.create.dapobject('contact');
        // Generate an HD public key for the user
        contactAcceptance.contact.hdextpubkey = user2HDKey
            .derive(derivingPath).hdPublicKey.toString();
        // Setting a relation to that user in object. Later this user can retrieve this object
        // from DAPI with getDapContext
        contactAcceptance.contact.relation = blockchainUser.regtxid;
        log.info('Contact request object:');
        log.info(contactAcceptance);

        // End of DashPay-specific code.

        log.info('Sending contact request to the network');
        await updateUserState(dashPayId, otherUserId.txid, [contactAcceptance], privateKeyString);

        log.info('Mining block to confirm changes');
        // Generate 1 block to confirm transition
        await api.generate(1);

        user1Space = await api.getUserDapSpace(dashPayId, blockchainUser.regtxid);
        log.info(`${username}'s DashPay dap space:`);
        log.info(user1Space);
        log.info('Contact in the first user\'s space:');
        log.info(user1Space.objects[0]);

        expect(user1Space.objects[0]).to.be.deep.equal({
            "contact": {
                "act": 1,
                "idx": 0,
                "rev": 0,
                "relation": otherUserId.txid,
                "hdextpubkey": contactRequest.contact.hdextpubkey
            }
        });

        const user2Space = await api.getUserDapSpace(dashPayId, otherUserId.txid);
        log.info(`${otherUserUsername}'s DashPay dap space:`);
        log.info(user2Space);
        log.info('Contact in the second user\'s space:');
        log.info(user2Space.objects[0]);

        expect(user2Space.dapid).to.equal(dashPayId);
        expect(user2Space.uid).to.equal(otherUserId.txid);
        expect(user2Space.objects).to.have.lengthOf(1);
        expect(user2Space.objects[0]).to.be.deep.equal({
            "contact":
                {
                    "act": 1,
                    "idx": 0,
                    "rev": 0,
                    "relation": user1Space.uid,
                    "hdextpubkey": contactAcceptance.contact.hdextpubkey
                }
        });
    });

    it('Should go through full accepting user request process with extra properties', async () => {
        const username = Math.random().toString(36).substring(7);
        await registerUser(username, privateKeyString);

        await api.generate(1);

        let blockchainUser = await api.getUser(username);

        const otherUserUsername = Math.random().toString(36).substring(7);
        const otherUserId = await registerUser(otherUserUsername, privateKeyString);

        await topUpUserCredits(blockchainUser.regtxid, privateKeyString);

        await api.generate(1);

        blockchainUser = await api.getUser(username);
        let dashPayDataContract = await api.getDapContract(dashPayId);

        if (!dashPayDataContract) {
            dashPayId = await registerDap(
                Schema.Daps.DashPay,
                privateKeyString,
                blockchainUser.regtxid,
            );
            await api.generate(1);
            dashPayDataContract = await api.getDapContract(dashPayId);
        } else {
            log.info('DashPay contract is already created. No need to create one');
        }

        const userRequest = Schema.create.dapobject('user');
        userRequest.user.aboutme = 'This is story about me';
        userRequest.user.avatar = 'My avatar here';
        userRequest.user.extra_property = 'this property was not defined in schema';

        await updateUserState(dashPayId, blockchainUser.regtxid, [userRequest], privateKeyString);
        await api.generate(1);

        let user1Space = await api.getUserDapSpace(dashPayId, blockchainUser.regtxid);

        const user2Context = await api.getUserDapContext(dashPayId, otherUserId.txid);

        const userAcceptance = Schema.create.dapobject('user');
        userAcceptance.user.hdextpubkey = user2HDKey
            .derive(derivingPath).hdPublicKey.toString();
        userAcceptance.user.relation = blockchainUser.regtxid;

        await updateUserState(dashPayId, otherUserId.txid, [userAcceptance], privateKeyString);

        await api.generate(1);

        user1Space = await api.getUserDapSpace(dashPayId, blockchainUser.regtxid);
        expect(user1Space.objects[0]).to.be.deep.equal({
            "user": {
                "act": 1,
                "idx": 0,
                "rev": 0,
                "avatar": "My avatar here",
                "aboutme": "This is story about me",
                extra_property: 'this property was not defined in schema'
            }
        });

        const user2Space = await api.getUserDapSpace(dashPayId, otherUserId.txid);
        expect(user2Space.dapid).to.equal(dashPayId);
        expect(user2Space.uid).to.equal(otherUserId.txid);
        expect(user2Space.objects).to.have.lengthOf(1);
        expect(user2Space.objects[0]).to.be.deep.equal({
            "user":
                {
                    "act": 1,
                    "idx": 0,
                    "rev": 0,
                    "relation": user1Space.uid,
                    "hdextpubkey": userAcceptance.user.hdextpubkey
                }
        });
    });

    it('Should go through full accepting user request process with properties', async () => {
        // Generating random username
        const username = Math.random().toString(36).substring(7);
        log.info('Your random username for this run is:');
        log.info(username);
        // Sending registration to the network
        // Note: in this example we assume that account owner is the same
        // person who funds registration, so only one private key is used.
        // Otherwise, owner should create registration transaction and
        // sign it with his own private key, and then pass it to the
        // funder, which will also sign this transaction with his key.
        await registerUser(username, privateKeyString);

        // Caution: this will work only in regtest mode.
        log.info('Mining block to confirm transaction.');
        log.info('Block hash is', await api.generate(1));

        // Checking user data
        let blockchainUser = await api.getUser(username);
        log.info('User profile:', blockchainUser);

        // Registering second user, which we will use later in this example
        const otherUserUsername = Math.random().toString(36).substring(7);
        const otherUserId = await registerUser(otherUserUsername, privateKeyString);
        log.info('Second user is', otherUserUsername, otherUserId);

        // To up user credits
        await topUpUserCredits(blockchainUser.regtxid, privateKeyString);

        // Caution: this will work only in regtest mode.
        log.info('Mining block to confirm transaction.');
        log.info('Block hash is', await api.generate(1));

        // Check user data
        blockchainUser = await api.getUser(username);
        log.info('User credits after top up:', blockchainUser.credits);

        // Registering dap, if it's not registered already:
        let dashPayDataContract = await api.getDapContract(dashPayId);

        if (!dashPayDataContract) {
            log.info('DashPay data contract not found. Creating one');
            dashPayId = await registerDap(
                Schema.Daps.DashPay,
                privateKeyString,
                blockchainUser.regtxid,
            );
            log.info('dashPayId:', dashPayId);
            // Confirming dap contract creation on-chain
            await api.generate(1);
            // Checking if it's really created
            dashPayDataContract = await api.getDapContract(dashPayId);
        } else {
            log.info('DashPay contract is already created. No need to create one');
        }

        log.info('DashPay data contract:');
        log.info(dashPayDataContract);

        // This code is DashPay-specific.

        log.info(`Creating friend request from ${username} to ${otherUserUsername}`);
        // Creating "user" object
        const userRequest = Schema.create.dapobject('user');
        // Set aboutme for the user
        userRequest.user.aboutme = 'This is story about me';
        // Set avatar for the user
        userRequest.user.avatar = 'My avatar here';
        log.info('Store request object:');
        log.info(userRequest);

        // End of DashPay-specific code.

        log.info('Sending user request to the network');
        await updateUserState(dashPayId, blockchainUser.regtxid, [userRequest], privateKeyString);

        log.info('Mining block to confirm changes');
        // Generate 1 block to confirm transition
        await api.generate(1);

        // Check first user dap space - user request should appear there:

        let user1Space = await api.getUserDapSpace(dashPayId, blockchainUser.regtxid);
        log.info(`${username}'s DashPay dap space:`);
        log.info(user1Space);
        log.info('User request in the first user\'s space:');
        log.info(user1Space.objects[0]);

        // Check second user dap context - friend request should appear there:

        // NOTE: If you get error around this line that says 'Cannot read property...'
        // You probably has different users stored in virtual dashdrive and dashcore.
        // It can happen if you flushed regtest data in dashcore, but not in virtual dashdrive.
        // To fix this, go to DAPI folder and delete vmn/stack-db.json
        const user2Context = await api.getUserDapContext(dashPayId, otherUserId.txid);
        log.info(`${otherUserUsername}'s DahPay dap context:`);
        log.info(user2Context);
        log.info('User request in the second user\'s space:');
        log.info(user2Context.related[0]);

        // Now we need to accept first user user request, i.e. create user object
        // on second user side, referencing first user's id:

        log.info(`Accepting user request from ${otherUserUsername} by ${username}`);
        // Creating "user" object
        const userAcceptance = Schema.create.dapobject('user');
        // Generate an HD public key for the user
        userAcceptance.user.hdextpubkey = user2HDKey
            .derive(derivingPath).hdPublicKey.toString();
        // Setting a relation to that user in object. Later this user can retrieve this object
        // from DAPI with getDapContext
        userAcceptance.user.relation = blockchainUser.regtxid;
        log.info('User request object:');
        log.info(userAcceptance);

        // End of DashPay-specific code.

        log.info('Sending user request to the network');
        await updateUserState(dashPayId, otherUserId.txid, [userAcceptance], privateKeyString);

        log.info('Mining block to confirm changes');
        // Generate 1 block to confirm transition
        await api.generate(1);

        user1Space = await api.getUserDapSpace(dashPayId, blockchainUser.regtxid);
        log.info(`${username}'s DashPay dap space:`);
        log.info(user1Space);
        log.info('User in the first user\'s space:');
        log.info(user1Space.objects[0]);

        expect(user1Space.objects[0]).to.be.deep.equal({
            "user": {
                "act": 1,
                "idx": 0,
                "rev": 0,
                "avatar": "My avatar here",
                "aboutme": "This is story about me"
            }
        });

        const user2Space = await api.getUserDapSpace(dashPayId, otherUserId.txid);
        log.info(`${otherUserUsername}'s DashPay dap space:`);
        log.info(user2Space);
        log.info('User in the second user\'s space:');
        log.info(user2Space.objects[0]);

        expect(user2Space.dapid).to.equal(dashPayId);
        expect(user2Space.uid).to.equal(otherUserId.txid);
        expect(user2Space.objects).to.have.lengthOf(1);
        expect(user2Space.objects[0]).to.be.deep.equal({
            "user":
                {
                    "act": 1,
                    "idx": 0,
                    "rev": 0,
                    "relation": user1Space.uid,
                    "hdextpubkey": userAcceptance.user.hdextpubkey
                }
        });

    });

    it('Should go through full accepting user request process without properties', async () => {
        const username = Math.random().toString(36).substring(7);
        await registerUser(username, privateKeyString);

        await api.generate(1);

        let blockchainUser = await api.getUser(username);

        // Registering second user, which we will use later in this example
        const otherUserUsername = Math.random().toString(36).substring(7);
        const otherUserId = await registerUser(otherUserUsername, privateKeyString);

        await topUpUserCredits(blockchainUser.regtxid, privateKeyString);
        await api.generate(1);

        blockchainUser = await api.getUser(username);

        let dashPayDataContract = await api.getDapContract(dashPayId);

        if (!dashPayDataContract) {
            dashPayId = await registerDap(
                Schema.Daps.DashPay,
                privateKeyString,
                blockchainUser.regtxid,
            );
            log.info('dashPayId:', dashPayId);
            await api.generate(1);
            dashPayDataContract = await api.getDapContract(dashPayId);
        } else {
            log.info('DashPay contract is already created. No need to create one');
        }

        const userRequest = Schema.create.dapobject('user');

        await updateUserState(dashPayId, blockchainUser.regtxid, [userRequest], privateKeyString);
        await api.generate(1);

        let user1Space = await api.getUserDapSpace(dashPayId, blockchainUser.regtxid);

        const user2Context = await api.getUserDapContext(dashPayId, otherUserId.txid);

        const userAcceptance = Schema.create.dapobject('user');
        userAcceptance.user.hdextpubkey = user2HDKey
            .derive(derivingPath).hdPublicKey.toString();
        userAcceptance.user.relation = blockchainUser.regtxid;

        await updateUserState(dashPayId, otherUserId.txid, [userAcceptance], privateKeyString);

        await api.generate(1);
        user1Space = await api.getUserDapSpace(dashPayId, blockchainUser.regtxid);
        expect(user1Space.objects[0]).to.be.deep.equal({
            "user": {
                "act": 1,
                "idx": 0,
                "rev": 0,
            }
        });

        const user2Space = await api.getUserDapSpace(dashPayId, otherUserId.txid);
        expect(user2Space.dapid).to.equal(dashPayId);
        expect(user2Space.uid).to.equal(otherUserId.txid);
        expect(user2Space.objects).to.have.lengthOf(1);
        expect(user2Space.objects[0]).to.be.deep.equal({
            "user":
                {
                    "act": 1,
                    "idx": 0,
                    "rev": 0,
                    "relation": user1Space.uid,
                    "hdextpubkey": userAcceptance.user.hdextpubkey
                }
        });
    });

    it('Should go through full accepting store request process without properties', async () => {
        // Generating random username
        const username = Math.random().toString(36).substring(7);
        log.info('Your random username for this run is:');
        log.info(username);
        // Sending registration to the network
        // Note: in this example we assume that account owner is the same
        // person who funds registration, so only one private key is used.
        // Otherwise, owner should create registration transaction and
        // sign it with his own private key, and then pass it to the
        // funder, which will also sign this transaction with his key.
        await registerUser(username, privateKeyString);

        // Caution: this will work only in regtest mode.
        log.info('Mining block to confirm transaction.');
        log.info('Block hash is', await api.generate(1));

        // Checking user data
        let blockchainUser = await api.getUser(username);
        log.info('User profile:', blockchainUser);

        // Registering second user, which we will use later in this example
        const otherUserUsername = Math.random().toString(36).substring(7);
        const otherUserId = await registerUser(otherUserUsername, privateKeyString);
        log.info('Second user is', otherUserUsername, otherUserId);

        // To up user credits
        await topUpUserCredits(blockchainUser.regtxid, privateKeyString);

        // Caution: this will work only in regtest mode.
        log.info('Mining block to confirm transaction.');
        log.info('Block hash is', await api.generate(1));

        // Check user data
        blockchainUser = await api.getUser(username);
        log.info('User credits after top up:', blockchainUser.credits);

        // Registering dap, if it's not registered already:
        let dashPayDataContract = await api.getDapContract(dashPayId);

        if (!dashPayDataContract) {
            log.info('DashPay data contract not found. Creating one');
            dashPayId = await registerDap(
                Schema.Daps.DashPay,
                privateKeyString,
                blockchainUser.regtxid,
            );
            log.info('dashPayId:', dashPayId);
            // Confirming dap contract creation on-chain
            await api.generate(1);
            // Checking if it's really created
            dashPayDataContract = await api.getDapContract(dashPayId);
        } else {
            log.info('DashPay contract is already created. No need to create one');
        }

        log.info('DashPay data contract:');
        log.info(dashPayDataContract);

        // This code is DashPay-specific.

        log.info(`Creating friend request from ${username} to ${otherUserUsername}`);
        // Creating "store" object
        const storeRequest = Schema.create.dapobject('store');
        // we don't set any properties for dap store
        log.info('Store request object:');
        log.info(storeRequest);

        // End of DashPay-specific code.

        log.info('Sending store request to the network');
        await updateUserState(dashPayId, blockchainUser.regtxid, [storeRequest], privateKeyString);

        log.info('Mining block to confirm changes');
        // Generate 1 block to confirm transition
        await api.generate(1);

        // Check first user dap space - store request should appear there:

        let user1Space = await api.getUserDapSpace(dashPayId, blockchainUser.regtxid);
        log.info(`${username}'s DashPay dap space:`);
        log.info(user1Space);
        log.info('Contact request in the first user\'s space:');
        log.info(user1Space.objects[0]);

        // Check second user dap context - friend request should appear there:

        // NOTE: If you get error around this line that says 'Cannot read property...'
        // You probably has different users stored in virtual dashdrive and dashcore.
        // It can happen if you flushed regtest data in dashcore, but not in virtual dashdrive.
        // To fix this, go to DAPI folder and delete vmn/stack-db.json
        const user2Context = await api.getUserDapContext(dashPayId, otherUserId.txid);
        log.info(`${otherUserUsername}'s DahPay dap context:`);
        log.info(user2Context);
        log.info('Contact request in the second user\'s space:');
        log.info(user2Context.related[0]);

        // Now we need to accept first user store request, i.e. create store object
        // on second user side, referencing first user's id:

        log.info(`Accepting store request from ${otherUserUsername} by ${username}`);
        // Creating "store" object
        const storeAcceptance = Schema.create.dapobject('store');
        // Generate an HD public key for the user
        storeAcceptance.store.hdextpubkey = user2HDKey
            .derive(derivingPath).hdPublicKey.toString();
        // Setting a relation to that user in object. Later this user can retrieve this object
        // from DAPI with getDapContext
        storeAcceptance.store.relation = blockchainUser.regtxid;
        log.info('Contact request object:');
        log.info(storeAcceptance);

        // End of DashPay-specific code.

        log.info('Sending store request to the network');
        await updateUserState(dashPayId, otherUserId.txid, [storeAcceptance], privateKeyString);

        log.info('Mining block to confirm changes');
        // Generate 1 block to confirm transition
        await api.generate(1);

        user1Space = await api.getUserDapSpace(dashPayId, blockchainUser.regtxid);
        log.info(`${username}'s DashPay dap space:`);
        log.info(user1Space);
        log.info('Store in the first user\'s space:');
        log.info(user1Space.objects[0]);

        expect(user1Space.objects[0]).to.be.deep.equal({
            "store": {
                "act": 1,
                "idx": 0,
                "rev": 0,
            }
        });

        const user2Space = await api.getUserDapSpace(dashPayId, otherUserId.txid);
        log.info(`${otherUserUsername}'s DashPay dap space:`);
        log.info(user2Space);
        log.info('Store in the second user\'s space:');
        log.info(user2Space.objects[0]);

        expect(user2Space.dapid).to.equal(dashPayId);
        expect(user2Space.uid).to.equal(otherUserId.txid);
        expect(user2Space.objects).to.have.lengthOf(1);
        expect(user2Space.objects[0]).to.be.deep.equal({
            "store":
                {
                    "act": 1,
                    "idx": 0,
                    "rev": 0,
                    "relation": user1Space.uid,
                    "hdextpubkey": storeAcceptance.store.hdextpubkey
                }
        });
    });


    it('Should go through full accepting store request process with extra properties', async () => {
        const username = Math.random().toString(36).substring(7);
        await registerUser(username, privateKeyString);

        await api.generate(1);

        let blockchainUser = await api.getUser(username);

        const otherUserUsername = Math.random().toString(36).substring(7);
        const otherUserId = await registerUser(otherUserUsername, privateKeyString);

        await topUpUserCredits(blockchainUser.regtxid, privateKeyString);

        await api.generate(1);

        blockchainUser = await api.getUser(username);

        let dashPayDataContract = await api.getDapContract(dashPayId);

        if (!dashPayDataContract) {
            dashPayId = await registerDap(
                Schema.Daps.DashPay,
                privateKeyString,
                blockchainUser.regtxid,
            );
            await api.generate(1);
            dashPayDataContract = await api.getDapContract(dashPayId);
        } else {
            log.info('DashPay contract is already created. No need to create one');
        }

        const storeRequest = Schema.create.dapobject('store');
        storeRequest.store.storename = 999;

        storeRequest.store.extra_property = "Why we allow to set extra property";

        await updateUserState(dashPayId, blockchainUser.regtxid, [storeRequest], privateKeyString);

        await api.generate(1);

        let user1Space = await api.getUserDapSpace(dashPayId, blockchainUser.regtxid);

        const user2Context = await api.getUserDapContext(dashPayId, otherUserId.txid);

        const storeAcceptance = Schema.create.dapobject('store');
        storeAcceptance.store.hdextpubkey = user2HDKey
            .derive(derivingPath).hdPublicKey.toString();
        storeAcceptance.store.relation = blockchainUser.regtxid;

        await updateUserState(dashPayId, otherUserId.txid, [storeAcceptance], privateKeyString);

        await api.generate(1);

        user1Space = await api.getUserDapSpace(dashPayId, blockchainUser.regtxid);
        expect(user1Space.objects[0]).to.be.deep.equal({
            "store": {
                "act": 1,
                "idx": 0,
                "rev": 0,
                "storename": 999,
                "extra_property": "Why we allow to set extra property"
            }
        });

        const user2Space = await api.getUserDapSpace(dashPayId, otherUserId.txid);
        expect(user2Space.objects[0]).to.be.deep.equal({
            "store":
                {
                    "act": 1,
                    "idx": 0,
                    "rev": 0,
                    "relation": user1Space.uid,
                    "hdextpubkey": storeAcceptance.store.hdextpubkey
                }
        });
    });

    it('Should go through full accepting store request process with properties', async () => {
        const username = Math.random().toString(36).substring(7);
        await registerUser(username, privateKeyString);

        await api.generate(1);

        let blockchainUser = await api.getUser(username);

        const otherUserUsername = Math.random().toString(36).substring(7);
        const otherUserId = await registerUser(otherUserUsername, privateKeyString);

        await topUpUserCredits(blockchainUser.regtxid, privateKeyString);

        await api.generate(1);

        blockchainUser = await api.getUser(username);

        let dashPayDataContract = await api.getDapContract(dashPayId);

        if (!dashPayDataContract) {
            dashPayId = await registerDap(
                Schema.Daps.DashPay,
                privateKeyString,
                blockchainUser.regtxid,
            );
            await api.generate(1);
            dashPayDataContract = await api.getDapContract(dashPayId);
        } else {
            log.info('DashPay contract is already created. No need to create one');
        }

        const storeRequest = Schema.create.dapobject('store');
        storeRequest.store.storename = 999;

        await updateUserState(dashPayId, blockchainUser.regtxid, [storeRequest], privateKeyString);

        await api.generate(1);

        let user1Space = await api.getUserDapSpace(dashPayId, blockchainUser.regtxid);

        const user2Context = await api.getUserDapContext(dashPayId, otherUserId.txid);

        const storeAcceptance = Schema.create.dapobject('store');
        storeAcceptance.store.hdextpubkey = user2HDKey
            .derive(derivingPath).hdPublicKey.toString();
        storeAcceptance.store.relation = blockchainUser.regtxid;

        await updateUserState(dashPayId, otherUserId.txid, [storeAcceptance], privateKeyString);
        await api.generate(1);

        user1Space = await api.getUserDapSpace(dashPayId, blockchainUser.regtxid);
        expect(user1Space.objects[0]).to.be.deep.equal({
            "store": {
                "act": 1,
                "idx": 0,
                "rev": 0,
                "storename": 999
            }
        });

        const user2Space = await api.getUserDapSpace(dashPayId, otherUserId.txid);
        expect(user2Space.objects[0]).to.be.deep.equal({
            "store":
                {
                    "act": 1,
                    "idx": 0,
                    "rev": 0,
                    "relation": user1Space.uid,
                    "hdextpubkey": storeAcceptance.store.hdextpubkey
                }
        });
    });
});
