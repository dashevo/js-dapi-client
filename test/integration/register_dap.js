'use strict';

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

let api;
let address;
let privateKey;
let publicKey;
let dashPayId = 'b4de10e1ddb8e225cd04a406deb98e6081f9bd26f98f46c0932d0bdfb2bd0623';

describe('sync.register_dap', () => {
    before(async () => {
        try {
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
        } catch (e) {
          console.error(e);
          process.exit(1);
        }
    });

    beforeEach(async () => {
        await api.generate(1);
        await timeout(1000);
    });

    it('Should not be able to accept contact if it has been deleted', async () => {
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

        let user1Space = await api.getUserDapSpace(dashPayId, blockchainUser.regtxid);
        expect(user1Space.objects).to.have.lengthOf(1);
        expect(user1Space.objects[0]).to.be.deep.equal({
            "contact": {
                "act": 1,
                "idx": 0,
                "rev": 0,
                "relation": otherUserId.txid,
                "hdextpubkey": contactRequest.contact.hdextpubkey
            }
        });
        // TODO post a ticket
        let user2Space = await api.getUserDapSpace(dashPayId, otherUserId.txid);
        expect(user2Space).to.equal(undefined);

        let user1Context = await api.getUserDapContext(dashPayId, blockchainUser.regtxid);
        expect(user1Context.dapid).to.equal(dashPayId);
        expect(user1Context.maxidx).to.equal(-1);
        expect(user1Context.objects).to.equal(null);
        expect(user1Context.related).to.have.lengthOf(0);
        expect(user1Context.uid).to.equal(null);

        let user2Context = await api.getUserDapContext(dashPayId, otherUserId.txid);
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

        // delete contact
        const contactDeleteRequest = Schema.create.dapobject('contact');
        contactDeleteRequest.contact.hdextpubkey = "";
        contactDeleteRequest.contact.relation = otherUserId.txid;
        contactDeleteRequest.contact.act = 3;
        updateUserState(dashPayId, blockchainUser.regtxid, [contactDeleteRequest], privateKeyString);
        await api.generate(1);

        //try to accept deleted contact
        const contactAcceptance = Schema.create.dapobject('contact');
        contactAcceptance.contact.hdextpubkey = user2HDKey
            .derive(derivingPath).hdPublicKey.toString();
        contactAcceptance.contact.relation = blockchainUser.regtxid;
        await updateUserState(dashPayId, otherUserId.txid, [contactAcceptance], privateKeyString);
        await api.generate(1);

        user1Context = await api.getUserDapContext(dashPayId, blockchainUser.regtxid);
        expect(user1Context.dapid).to.equal(dashPayId);
        expect(user1Context.maxidx).to.equal(-1);
        expect(user1Context.objects).to.equal(null);
        expect(user1Context.related).to.have.lengthOf(0);
        expect(user1Context.uid).to.equal(null);

        user2Context = await api.getUserDapContext(dashPayId, otherUserId.txid);
        expect(user2Context.dapid).to.equal(dashPayId);
        expect(user2Context.maxidx).to.equal(-1);
        expect(user2Context.objects).to.have.lengthOf(1);
        expect(user2Context.objects[0]).to.be.deep.equal({
            "contact": {
                "act": 1,
                "hdextpubkey": contactAcceptance.contact.hdextpubkey,
                "idx": 0,
                "relation": user1Space.uid,
                "rev": 0
            }
        });
        expect(user2Context.related).to.have.lengthOf(0);

        user1Space = await api.getUserDapSpace(dashPayId, blockchainUser.regtxid);
        expect(user1Space.objects).to.have.lengthOf(0);

        user2Space = await api.getUserDapSpace(dashPayId, otherUserId.txid);
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

        blockchainUser = await api.getUserByName(username);
        expect(blockchainUser.subtx).to.have.lengthOf(2);
        expect(blockchainUser.transitions).to.have.lengthOf(3);

        let otherUser = await api.getUserByName(otherUserUsername);
        expect(otherUser.subtx).to.have.lengthOf(1);
        expect(otherUser.transitions).to.have.lengthOf(1);
    });

    it('Should have correct behavior with contact requests for create/delete/update based on relations state', async () => {
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

        let contactRequest = Schema.create.dapobject('contact');
        contactRequest.contact.hdextpubkey = "";
        contactRequest.contact.relation = otherUserId.txid;
        await updateUserState(dashPayId, blockchainUser.regtxid, [contactRequest], privateKeyString);
        await api.generate(1);

        // try to re-create contact request
        contactRequest = Schema.create.dapobject('contact');
        contactRequest.contact.hdextpubkey = "";
        contactRequest.contact.relation = otherUserId.txid;
        return expect(updateUserState(dashPayId, blockchainUser.regtxid, [contactRequest], privateKeyString)).to.be.rejectedWith('DAPI RPC error: sendRawTransition: Wasn\'t able to pin packet');
        await api.generate(1);

        // update contact request
        contactRequest = Schema.create.dapobject('contact');
        contactRequest.contact.hdextpubkey = "";
        contactRequest.contact.relation = otherUserId.txid;
        contactRequest.contact.act = 2;
        await updateUserState(dashPayId, blockchainUser.regtxid, [contactRequest], privateKeyString);
        await api.generate(1);

        // delete contact
        contactRequest = Schema.create.dapobject('contact');
        contactRequest.contact.hdextpubkey = "";
        contactRequest.contact.relation = otherUserId.txid;
        contactRequest.contact.act = 3;
        return expect(updateUserState(dashPayId, blockchainUser.regtxid, [contactRequest], privateKeyString)).to.be.rejectedWith('DAPI RPC error: sendRawTransition: Wasn\'t able to pin packet');
        await api.generate(1);

        //TODO why we can update without creation?
        // update contact request
        contactRequest = Schema.create.dapobject('contact');
        contactRequest.contact.hdextpubkey = "";
        contactRequest.contact.relation = otherUserId.txid;
        contactRequest.contact.act = 2;
        await updateUserState(dashPayId, blockchainUser.regtxid, [contactRequest], privateKeyString);
        await api.generate(1);

        // try to re-create contact request after deletion
        contactRequest = Schema.create.dapobject('contact');
        contactRequest.contact.hdextpubkey = "";
        contactRequest.contact.relation = otherUserId.txid;
        updateUserState(dashPayId, blockchainUser.regtxid, [contactRequest], privateKeyString);
        await api.generate(1);
    });

    it('Should be able to resend updated request contact before accepting', async () => {
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


        const contactUpdateRequest = Schema.create.dapobject('contact');
        contactUpdateRequest.contact.hdextpubkey = user1HDKey
            .derive(derivingPath).hdPublicKey.toString();
        contactUpdateRequest.contact.relation = otherUserId.txid;
        contactUpdateRequest.contact.extra_param = "new_param_added";
        contactUpdateRequest.contact.act = 2;

        await updateUserState(dashPayId, blockchainUser.regtxid, [contactUpdateRequest], privateKeyString);
        await api.generate(1);

        let user1Space = await api.getUserDapSpace(dashPayId, blockchainUser.regtxid);
        expect(user1Space.objects).to.have.lengthOf(1);
        expect(user1Space.objects[0]).to.be.deep.equal({
            "contact": {
                "act": 2,
                "extra_param": "new_param_added",
                "idx": 0,
                "rev": 0,
                "relation": otherUserId.txid,
                "hdextpubkey": contactRequest.contact.hdextpubkey
            }
        });

        let user2Space = await api.getUserDapSpace(dashPayId, otherUserId.txid);
        expect(user2Space).to.equal(undefined);

        let user1Context = await api.getUserDapContext(dashPayId, blockchainUser.regtxid);
        expect(user1Context.dapid).to.equal(dashPayId);
        expect(user1Context.maxidx).to.equal(-1);
        expect(user1Context.objects).to.equal(null);
        expect(user1Context.related).to.have.lengthOf(0);
        expect(user1Context.uid).to.equal(null);

        let user2Context = await api.getUserDapContext(dashPayId, otherUserId.txid);
        expect(user2Context.dapid).to.equal(dashPayId);
        expect(user2Context.maxidx).to.equal(-1);
        expect(user2Context.objects).to.equal(null);
        expect(user2Context.related).to.have.lengthOf(1);
        expect(user2Context.related[0]).to.be.deep.equal({
            "contact": {
                "act": 2,
                "extra_param": "new_param_added",
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

        user1Context = await api.getUserDapContext(dashPayId, blockchainUser.regtxid);
        expect(user1Context.dapid).to.equal(dashPayId);
        expect(user1Context.maxidx).to.equal(-1);
        expect(user1Context.objects).to.equal(null);
        expect(user1Context.related).to.have.lengthOf(0);
        expect(user1Context.uid).to.equal(null);

        user2Context = await api.getUserDapContext(dashPayId, otherUserId.txid);
        expect(user2Context.dapid).to.equal(dashPayId);
        expect(user2Context.maxidx).to.equal(-1);
        expect(user2Context.objects).to.have.lengthOf(1);
        expect(user2Context.objects[0]).to.be.deep.equal({
            "contact": {
                "act": 1,
                "hdextpubkey": contactAcceptance.contact.hdextpubkey,
                "idx": 0,
                "relation": user1Space.uid,
                "rev": 0
            }
        });
        expect(user2Context.related).to.have.lengthOf(1);
        expect(user2Context.related[0]).to.be.deep.equal({
            "contact": {
                "act": 2,
                "extra_param": "new_param_added",
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

        user1Space = await api.getUserDapSpace(dashPayId, blockchainUser.regtxid);
        expect(user1Space.objects).to.have.lengthOf(1);
        expect(user1Space.objects[0]).to.be.deep.equal({
            "contact": {
                "act": 2,
                "extra_param": "new_param_added",
                "idx": 0,
                "rev": 0,
                "relation": otherUserId.txid,
                "hdextpubkey": contactRequest.contact.hdextpubkey
            }
        });

        user2Space = await api.getUserDapSpace(dashPayId, otherUserId.txid);
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

        blockchainUser = await api.getUserByName(username);
        expect(blockchainUser.subtx).to.have.lengthOf(2);
        expect(blockchainUser.transitions).to.have.lengthOf(2);

        let otherUser = await api.getUserByName(otherUserUsername);
        expect(otherUser.subtx).to.have.lengthOf(1);
        expect(otherUser.transitions).to.have.lengthOf(1);

        await api.generate(1);
        user2Context = await api.getUserDapContext(dashPayId, otherUserId.txid);
        expect(user2Context.dapid).to.equal(dashPayId);
        expect(user2Context.maxidx).to.equal(-1);
        expect(user2Context.objects).to.have.lengthOf(1);
        expect(user2Context.objects[0]).to.be.deep.equal({
            "contact": {
                "act": 1,
                "hdextpubkey": contactAcceptance.contact.hdextpubkey,
                "idx": 0,
                "relation": user1Space.uid,
                "rev": 0
            }
        });
        expect(user2Context.related).to.have.lengthOf(1);
        expect(user2Context.related[0]).to.be.deep.equal({
            "contact": {
                "act": 2,
                "extra_param": "new_param_added",
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

        // create request to delete the user from contacts
        const contactRequestDelete = Schema.create.dapobject('contact');
        contactRequestDelete.contact.hdextpubkey = user2HDKey
            .derive(derivingPath).hdPublicKey.toString();
        contactRequestDelete.contact.relation = otherUserId.txid;
        contactRequestDelete.contact.act = 3;

        await updateUserState(dashPayId, blockchainUser.regtxid, [contactRequestDelete], privateKeyString);
        await api.generate(1);

        user1Space = await api.getUserDapSpace(dashPayId, blockchainUser.regtxid);
        expect(user1Space.objects).to.have.lengthOf(0);

        user2Space = await api.getUserDapSpace(dashPayId, otherUserId.txid);
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

        user1Context = await api.getUserDapContext(dashPayId, blockchainUser.regtxid);
        expect(user1Context.dapid).to.equal(dashPayId);
        expect(user1Context.maxidx).to.equal(-1);
        expect(user1Context.objects).to.equal(null);
        expect(user1Context.related).to.have.lengthOf(0);
        expect(user1Context.uid).to.equal(null);

        user2Context = await api.getUserDapContext(dashPayId, otherUserId.txid);
        expect(user2Context.dapid).to.equal(dashPayId);
        expect(user2Context.maxidx).to.equal(-1);
        expect(user2Context.objects).to.have.lengthOf(1);
        expect(user2Context.objects[0]).to.be.deep.equal({
            "contact": {
                "act": 1,
                "hdextpubkey": contactAcceptance.contact.hdextpubkey,
                "idx": 0,
                "relation": user1Space.uid,
                "rev": 0
            }
        });
        expect(user2Context.related).to.have.lengthOf(0);
    });


    it('TODO why we can set act = 3 for non created contact?', async () => {
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
        contactRequest.contact.act = 3;

        await updateUserState(dashPayId, blockchainUser.regtxid, [contactRequest], privateKeyString);
        await api.generate(1);

        let user1Space = await api.getUserDapSpace(dashPayId, blockchainUser.regtxid);
        expect(user1Space.objects).to.have.lengthOf(1);
        expect(user1Space.objects[0]).to.be.deep.equal({
            "contact": {
                "act": 3,
                "idx": 0,
                "rev": 0,
                "relation": otherUserId.txid,
                "hdextpubkey": contactRequest.contact.hdextpubkey
            }
        });

        // let user2Space = await api.getUserDapSpace(dashPayId, otherUserId.txid);
        // expect(user2Space).to.equal(undefined);

        let user1Context = await api.getUserDapContext(dashPayId, blockchainUser.regtxid);
        expect(user1Context.dapid).to.equal(dashPayId);
        expect(user1Context.maxidx).to.equal(-1);
        expect(user1Context.objects).to.equal(null);
        expect(user1Context.related).to.have.lengthOf(0);
        expect(user1Context.uid).to.equal(null);

        let user2Context = await api.getUserDapContext(dashPayId, otherUserId.txid);
        expect(user2Context.dapid).to.equal(dashPayId);
        expect(user2Context.maxidx).to.equal(-1);
        expect(user2Context.objects).to.equal(null);
        expect(user2Context.related).to.have.lengthOf(1);
        expect(user2Context.related[0]).to.be.deep.equal({
            "contact": {
                "act": 3,
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
        contactAcceptance.contact.act = 3;
        await updateUserState(dashPayId, otherUserId.txid, [contactAcceptance], privateKeyString);
        await api.generate(1);

        user1Context = await api.getUserDapContext(dashPayId, blockchainUser.regtxid);
        expect(user1Context.dapid).to.equal(dashPayId);
        expect(user1Context.maxidx).to.equal(-1);
        expect(user1Context.objects).to.equal(null);
        expect(user1Context.related).to.have.lengthOf(0);
        expect(user1Context.uid).to.equal(null);

        user2Context = await api.getUserDapContext(dashPayId, otherUserId.txid);
        expect(user2Context.dapid).to.equal(dashPayId);
        expect(user2Context.maxidx).to.equal(-1);
        expect(user2Context.objects).to.have.lengthOf(1);
        expect(user2Context.objects[0]).to.be.deep.equal({
            "contact": {
                "act": 3,
                "hdextpubkey": contactAcceptance.contact.hdextpubkey,
                "idx": 0,
                "relation": user1Space.uid,
                "rev": 0
            }
        });
        expect(user2Context.related).to.have.lengthOf(1);
        expect(user2Context.related[0]).to.be.deep.equal({
            "contact": {
                "act": 3,
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

        user1Space = await api.getUserDapSpace(dashPayId, blockchainUser.regtxid);
        expect(user1Space.objects).to.have.lengthOf(1);
        expect(user1Space.objects[0]).to.be.deep.equal({
            "contact": {
                "act": 3,
                "idx": 0,
                "rev": 0,
                "relation": otherUserId.txid,
                "hdextpubkey": contactRequest.contact.hdextpubkey
            }
        });

        let user2Space = await api.getUserDapSpace(dashPayId, otherUserId.txid);
        expect(user2Space.dapid).to.equal(dashPayId);
        expect(user2Space.uid).to.equal(otherUserId.txid);
        expect(user2Space.objects).to.have.lengthOf(1);
        expect(user2Space.objects[0]).to.be.deep.equal({
            "contact":
                {
                    "act": 3,
                    "idx": 0,
                    "rev": 0,
                    "relation": user1Space.uid,
                    "hdextpubkey": contactAcceptance.contact.hdextpubkey
                }
        });

        blockchainUser = await api.getUserByName(username);
        expect(blockchainUser.subtx).to.have.lengthOf(2);
        expect(blockchainUser.transitions).to.have.lengthOf(1); // ????

        let otherUser = await api.getUserByName(otherUserUsername);
        expect(otherUser.subtx).to.have.lengthOf(1);
        expect(otherUser.transitions).to.have.lengthOf(1);

        await api.generate(1);
        user2Context = await api.getUserDapContext(dashPayId, otherUserId.txid);
        expect(user2Context.dapid).to.equal(dashPayId);
        expect(user2Context.maxidx).to.equal(-1);
        expect(user2Context.objects).to.have.lengthOf(1);
        expect(user2Context.objects[0]).to.be.deep.equal({
            "contact": {
                "act": 3,
                "hdextpubkey": contactAcceptance.contact.hdextpubkey,
                "idx": 0,
                "relation": user1Space.uid,
                "rev": 0
            }
        });
        expect(user2Context.related).to.have.lengthOf(1);
        expect(user2Context.related[0]).to.be.deep.equal({
            "contact": {
                "act": 3,
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

        // create request to delete the user from contacts
        const contactRequestDelete = Schema.create.dapobject('contact');
        contactRequestDelete.contact.hdextpubkey = '';
        contactRequestDelete.contact.relation = otherUserId.txid;
        contactRequestDelete.contact.act = 3;

        await updateUserState(dashPayId, blockchainUser.regtxid, [contactRequestDelete], privateKeyString);
        await api.generate(1);

        user1Space = await api.getUserDapSpace(dashPayId, blockchainUser.regtxid);
        expect(user1Space.objects).to.have.lengthOf(0);

        user2Space = await api.getUserDapSpace(dashPayId, otherUserId.txid);
        expect(user2Space.dapid).to.equal(dashPayId);
        expect(user2Space.uid).to.equal(otherUserId.txid);
        expect(user2Space.objects).to.have.lengthOf(1);
        expect(user2Space.objects[0]).to.be.deep.equal({
            "contact":
                {
                    "act": 3,
                    "idx": 0,
                    "rev": 0,
                    "relation": user1Space.uid,
                    "hdextpubkey": contactAcceptance.contact.hdextpubkey
                }
        });

        user1Context = await api.getUserDapContext(dashPayId, blockchainUser.regtxid);
        expect(user1Context.dapid).to.equal(dashPayId);
        expect(user1Context.maxidx).to.equal(-1);
        expect(user1Context.objects).to.equal(null);
        expect(user1Context.related).to.have.lengthOf(0);
        expect(user1Context.uid).to.equal(null);

        user2Context = await api.getUserDapContext(dashPayId, otherUserId.txid);
        expect(user2Context.dapid).to.equal(dashPayId);
        expect(user2Context.maxidx).to.equal(-1);
        expect(user2Context.objects).to.have.lengthOf(1);
        expect(user2Context.objects[0]).to.be.deep.equal({
            "contact": {
                "act": 3,
                "hdextpubkey": contactAcceptance.contact.hdextpubkey,
                "idx": 0,
                "relation": user1Space.uid,
                "rev": 0
            }
        });
        expect(user2Context.related).to.have.lengthOf(0);
        await api.generate(1);
    });

    it('Should be able to remove contact', async () => {
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

        let user1Space = await api.getUserDapSpace(dashPayId, blockchainUser.regtxid);
        expect(user1Space.objects).to.have.lengthOf(1);
        expect(user1Space.objects[0]).to.be.deep.equal({
            "contact": {
                "act": 1,
                "idx": 0,
                "rev": 0,
                "relation": otherUserId.txid,
                "hdextpubkey": contactRequest.contact.hdextpubkey
            }
        });

        let user2Space = await api.getUserDapSpace(dashPayId, otherUserId.txid);
        expect(user2Space).to.equal(undefined);

        let user1Context = await api.getUserDapContext(dashPayId, blockchainUser.regtxid);
        expect(user1Context.dapid).to.equal(dashPayId);
        expect(user1Context.maxidx).to.equal(-1);
        expect(user1Context.objects).to.equal(null);
        expect(user1Context.related).to.have.lengthOf(0);
        expect(user1Context.uid).to.equal(null);

        let user2Context = await api.getUserDapContext(dashPayId, otherUserId.txid);
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

        user1Context = await api.getUserDapContext(dashPayId, blockchainUser.regtxid);
        expect(user1Context.dapid).to.equal(dashPayId);
        expect(user1Context.maxidx).to.equal(-1);
        expect(user1Context.objects).to.equal(null);
        expect(user1Context.related).to.have.lengthOf(0);
        expect(user1Context.uid).to.equal(null);

        user2Context = await api.getUserDapContext(dashPayId, otherUserId.txid);
        expect(user2Context.dapid).to.equal(dashPayId);
        expect(user2Context.maxidx).to.equal(-1);
        expect(user2Context.objects).to.have.lengthOf(1);
        expect(user2Context.objects[0]).to.be.deep.equal({
            "contact": {
                "act": 1,
                "hdextpubkey": contactAcceptance.contact.hdextpubkey,
                "idx": 0,
                "relation": user1Space.uid,
                "rev": 0
            }
        });
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

        user1Space = await api.getUserDapSpace(dashPayId, blockchainUser.regtxid);
        expect(user1Space.objects).to.have.lengthOf(1);
        expect(user1Space.objects[0]).to.be.deep.equal({
            "contact": {
                "act": 1,
                "idx": 0,
                "rev": 0,
                "relation": otherUserId.txid,
                "hdextpubkey": contactRequest.contact.hdextpubkey
            }
        });

        user2Space = await api.getUserDapSpace(dashPayId, otherUserId.txid);
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

        blockchainUser = await api.getUserByName(username);
        expect(blockchainUser.subtx).to.have.lengthOf(2);
        expect(blockchainUser.transitions).to.have.lengthOf(1);

        let otherUser = await api.getUserByName(otherUserUsername);
        expect(otherUser.subtx).to.have.lengthOf(1);
        expect(otherUser.transitions).to.have.lengthOf(1);

        await api.generate(1);
        user2Context = await api.getUserDapContext(dashPayId, otherUserId.txid);
        expect(user2Context.dapid).to.equal(dashPayId);
        expect(user2Context.maxidx).to.equal(-1);
        expect(user2Context.objects).to.have.lengthOf(1);
        expect(user2Context.objects[0]).to.be.deep.equal({
            "contact": {
                "act": 1,
                "hdextpubkey": contactAcceptance.contact.hdextpubkey,
                "idx": 0,
                "relation": user1Space.uid,
                "rev": 0
            }
        });
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

        // create request to delete the user from contacts
        const contactRequestDelete = Schema.create.dapobject('contact');
        contactRequestDelete.contact.hdextpubkey = user2HDKey
            .derive(derivingPath).hdPublicKey.toString();
        contactRequestDelete.contact.relation = otherUserId.txid;
        contactRequestDelete.contact.act = 3;

        await updateUserState(dashPayId, blockchainUser.regtxid, [contactRequestDelete], privateKeyString);
        await api.generate(1);

        user1Space = await api.getUserDapSpace(dashPayId, blockchainUser.regtxid);
        expect(user1Space.objects).to.have.lengthOf(0);

        user2Space = await api.getUserDapSpace(dashPayId, otherUserId.txid);
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

        user1Context = await api.getUserDapContext(dashPayId, blockchainUser.regtxid);
        expect(user1Context.dapid).to.equal(dashPayId);
        expect(user1Context.maxidx).to.equal(-1);
        expect(user1Context.objects).to.equal(null);
        expect(user1Context.related).to.have.lengthOf(0);
        expect(user1Context.uid).to.equal(null);

        user2Context = await api.getUserDapContext(dashPayId, otherUserId.txid);
        expect(user2Context.dapid).to.equal(dashPayId);
        expect(user2Context.maxidx).to.equal(-1);
        expect(user2Context.objects).to.have.lengthOf(1);
        expect(user2Context.objects[0]).to.be.deep.equal({
            "contact": {
                "act": 1,
                "hdextpubkey": contactAcceptance.contact.hdextpubkey,
                "idx": 0,
                "relation": user1Space.uid,
                "rev": 0
            }
        });
        expect(user2Context.related).to.have.lengthOf(0);
    });

    it('Should be able to send and accept many contact requests at the same time with many DapContracts', async () => {
        const numAdditionalUsers = 3;
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

        await api.generate(1);
        await updateUserState(dashPayId, blockchainUser.regtxid, [contactRequest], privateKeyString);

        var i;
        var blockchainUsers = [];
        let contactRequests = [];
        for (i = 0; i < numAdditionalUsers; i++) {
            await timeout(800);
            const username2 = Math.random().toString(36).substring(7);
            await registerUser(username2, privateKeyString);
            await api.generate(1);
            let blockchainUser2 = await api.getUserByName(username2);
            await topUpUserCredits(blockchainUser2.regtxid, privateKeyString);
            await api.generate(1);
            blockchainUser2 = await api.getUserByName(username2);
            blockchainUsers.push(blockchainUser2);

            let dashPayId2 = await registerDap(
                Schema.Daps.DashPay,
                privateKeyString,
                blockchainUser2.regtxid,
            );

            let contactRequest2 = Schema.create.dapobject('contact');
            contactRequest2.contact.hdextpubkey = user1HDKey
                .derive(derivingPath).hdPublicKey.toString();
            contactRequest2.contact.relation = otherUserId.txid;
            await api.generate(1);
            await updateUserState(dashPayId2, blockchainUser2.regtxid, [contactRequest2], privateKeyString);
            contactRequests.push(contactRequest2);
        }

        const otherUserContext = await api.getUserDapContext(dashPayId, otherUserId.txid);

        expect(otherUserContext.dapid).to.equal(dashPayId);
        expect(otherUserContext.maxidx).to.equal(-1);
        expect(otherUserContext.objects).to.equal(null);
        expect(otherUserContext.related).to.have.lengthOf(numAdditionalUsers + 1);

        const contactAcceptance = Schema.create.dapobject('contact');
        contactAcceptance.contact.hdextpubkey = user2HDKey
            .derive(derivingPath).hdPublicKey.toString();
        contactAcceptance.contact.relation = blockchainUser.regtxid;

        let contactAcceptances = [];
        for (i = 0; i < numAdditionalUsers; i++) {
            const contactAcceptance2 = Schema.create.dapobject('contact');
            contactAcceptance2.contact.hdextpubkey = user2HDKey
                .derive(derivingPath).hdPublicKey.toString();
            contactAcceptance2.contact.relation = blockchainUsers[i].regtxid;
            contactAcceptances.push(contactAcceptance2);

        }
        contactAcceptances.push(contactAcceptance);
        await updateUserState(dashPayId, otherUserId.txid, contactAcceptances, privateKeyString);
        await api.generate(1);

        let user1Space = await api.getUserDapSpace(dashPayId, blockchainUser.regtxid);
        expect(user1Space.dapid).to.be.deep.equal(dashPayId);
        expect(user1Space.objects).to.have.lengthOf(1);
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
        expect(user2Space.objects).to.have.lengthOf(numAdditionalUsers + 1);


        const user2Context = await api.getUserDapContext(dashPayId, otherUserId.txid);
        expect(user2Context.dapid).to.equal(dashPayId);
        expect(user2Context.maxidx).to.equal(-1);
        expect(user2Context.objects).to.have.lengthOf(numAdditionalUsers + 1);
        expect(user2Context.related).to.have.lengthOf(numAdditionalUsers + 1);
    });

    it('Should be able to accept 2 contact requests at the same time with 1 DapContract', async () => {
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

        await timeout(1000);
        const username2 = Math.random().toString(36).substring(7);
        await registerUser(username2, privateKeyString);
        await api.generate(1);
        let blockchainUser2 = await api.getUserByName(username2);
        await topUpUserCredits(blockchainUser2.regtxid, privateKeyString);
        await api.generate(1);
        blockchainUser2 = await api.getUserByName(username2);
        await api.generate(1);

        const contactRequest2 = Schema.create.dapobject('contact');
        contactRequest2.contact.hdextpubkey = user1HDKey
            .derive(derivingPath).hdPublicKey.toString();
        contactRequest2.contact.relation = otherUserId.txid;

        // Sending contact requests to the network
        await updateUserState(dashPayId, blockchainUser.regtxid, [contactRequest], privateKeyString);
        await updateUserState(dashPayId, blockchainUser2.regtxid, [contactRequest2], privateKeyString);
        await api.generate(1);

        const otherUserContext = await api.getUserDapContext(dashPayId, otherUserId.txid);

        expect(otherUserContext.dapid).to.equal(dashPayId);
        expect(otherUserContext.maxidx).to.equal(-1);
        expect(otherUserContext.objects).to.equal(null);
        expect(otherUserContext.related).to.have.lengthOf(2);
        expect(otherUserContext.related[0]).to.be.deep.equal({
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
        expect(otherUserContext.related[1]).to.be.deep.equal({
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

        // Now we need to accept contact requests
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
        expect(user1Space.dapid).to.be.deep.equal(dashPayId);
        expect(user1Space.objects).to.have.lengthOf(1);
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
        expect(user1Space2.dapid).to.be.deep.equal(dashPayId);
        expect(user1Space2.objects).to.have.lengthOf(1);
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

    it('Should be able to accept 2 contact requests at the same time with 2 DapContract', async () => {
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

        await timeout(1000);
        const username2 = Math.random().toString(36).substring(7);
        await registerUser(username2, privateKeyString);
        await api.generate(1);
        let blockchainUser2 = await api.getUserByName(username2);
        await topUpUserCredits(blockchainUser2.regtxid, privateKeyString);
        await api.generate(1);
        blockchainUser2 = await api.getUserByName(username2);

        let dashPayId2 = await registerDap(
            Schema.Daps.DashPay,
            privateKeyString,
            blockchainUser2.regtxid,
        );
        await api.generate(1);

        const contactRequest2 = Schema.create.dapobject('contact');
        contactRequest2.contact.hdextpubkey = user1HDKey
            .derive(derivingPath).hdPublicKey.toString();
        contactRequest2.contact.relation = otherUserId.txid;

        // Sending contact requests to the network
        await updateUserState(dashPayId, blockchainUser.regtxid, [contactRequest], privateKeyString);
        await updateUserState(dashPayId2, blockchainUser2.regtxid, [contactRequest2], privateKeyString);
        await api.generate(1);

        const otherUserContext = await api.getUserDapContext(dashPayId, otherUserId.txid);

        expect(otherUserContext.dapid).to.equal(dashPayId);
        expect(otherUserContext.maxidx).to.equal(-1);
        expect(otherUserContext.objects).to.equal(null);
        expect(otherUserContext.related).to.have.lengthOf(2);
        expect(otherUserContext.related[0]).to.be.deep.equal({
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
        expect(otherUserContext.related[1]).to.be.deep.equal({
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

        // Now we need to accept contact requests
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
        expect(user1Space.dapid).to.be.deep.equal(dashPayId);
        expect(user1Space.objects).to.have.lengthOf(1);
        expect(user1Space.objects[0]).to.be.deep.equal({
            "contact": {
                "act": 1,
                "idx": 0,
                "rev": 0,
                "relation": otherUserId.txid,
                "hdextpubkey": contactRequest.contact.hdextpubkey
            }
        });

        let user1Space2 = await api.getUserDapSpace(dashPayId2, blockchainUser2.regtxid);
        expect(user1Space2.dapid).to.be.deep.equal(dashPayId2);
        expect(user1Space2.objects).to.have.lengthOf(1);
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

        await timeout(1000);
        const thirdUserUsername = Math.random().toString(36).substring(7);
        const thirdUserId = await registerUser(thirdUserUsername, privateKeyString);

        // To up user credits
        await topUpUserCredits(blockchainUser.regtxid, privateKeyString);

        await api.generate(1);

        const contactRequest2 = Schema.create.dapobject('contact');
        contactRequest2.contact.hdextpubkey = user1HDKey
            .derive(derivingPath).hdPublicKey.toString();
        contactRequest2.contact.relation = thirdUserId.txid;

        // Send 2 contact requests to diff users in the same transaction
        await updateUserState(dashPayId, blockchainUser.regtxid, [contactRequest, contactRequest2], privateKeyString);
        await api.generate(1);

        let user1Space = await api.getUserDapSpace(dashPayId, blockchainUser.regtxid);
        expect(user1Space.objects).to.have.lengthOf(2);
        expect(user1Space.objects[0]).to.be.deep.equal({
            "contact": {
                "act": 1,
                "idx": 0,
                "rev": 0,
                "relation": otherUserId.txid,
                "hdextpubkey": contactRequest.contact.hdextpubkey
            }
        });
        expect(user1Space.objects[1]).to.be.deep.equal({
            "contact": {
                "act": 1,
                "idx": 0,
                "rev": 0,
                "relation": thirdUserId.txid,
                "hdextpubkey": contactRequest2.contact.hdextpubkey
            }
        });

        // check UserDapContext for otherUser
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

        // check UserDapContext for thirdUser
        const user2Context2 = await api.getUserDapContext(dashPayId, thirdUserId.txid);
        expect(user2Context2.dapid).to.equal(dashPayId);
        expect(user2Context2.maxidx).to.equal(-1);
        expect(user2Context2.objects).to.equal(null);
        expect(user2Context2.related).to.have.lengthOf(1);
        expect(user2Context2.related[0]).to.be.deep.equal({
            "contact": {
                "act": 1,
                "idx": 0,
                "rev": 0,
                "relation": thirdUserId.txid,
                "hdextpubkey": contactRequest2.contact.hdextpubkey,
                "meta": {
                    "uid": blockchainUser.regtxid,
                    "uname": username
                }
            }
        });

        const contactAcceptance2 = Schema.create.dapobject('contact');
        contactAcceptance2.contact.hdextpubkey = user2HDKey
            .derive(derivingPath).hdPublicKey.toString();
        contactAcceptance2.contact.relation = blockchainUser.regtxid;

        await updateUserState(dashPayId, thirdUserId.txid, [contactAcceptance2], privateKeyString);
        await api.generate(1);

        const user3Space = await api.getUserDapSpace(dashPayId, thirdUserId.txid);
        expect(user3Space.dapid).to.equal(dashPayId);
        expect(user3Space.uid).to.equal(thirdUserId.txid);
        expect(user3Space.objects).to.have.lengthOf(1);
        expect(user3Space.objects[0]).to.be.deep.equal({
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
        let blockchainUser = await api.getUserByName(username);
        await topUpUserCredits(blockchainUser.regtxid, privateKeyString);
        await api.generate(1);
        blockchainUser = await api.getUserByName(username);

        let dashPayDataContract = await api.getDapContract(dashPayId);
        // TODO need fix from Anton
        if (!dashPayDataContract) {
            dashPayId = await registerDap(
                Schema.Daps.DashPay,
                privateKeyString,
                blockchainUser.regtxid,
            );
            await api.generate(1);
            dashPayDataContract = await api.getDapContract(dashPayId);
        }

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

    it('Should not be able to resend contact request after accepting', async () => {
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

        let user1Space = await api.getUserDapSpace(dashPayId, blockchainUser.regtxid);
        expect(user1Space.objects).to.have.lengthOf(1);

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

        blockchainUser = await api.getUserByName(username);
        const contactRequest2 = Schema.create.dapobject('contact');
        contactRequest2.contact.hdextpubkey = user1HDKey
            .derive(derivingPath).hdPublicKey.toString();
        contactRequest2.contact.relation = otherUserId.txid;

        await api.generate(1);
        return expect(updateUserState(dashPayId, blockchainUser.regtxid, [contactRequest2], privateKeyString)).to.be.rejectedWith('DAPI RPC error: sendRawTransition: Wasn\'t able to pin packet');
    });


    it('Should not be able to send request contact twice', async () => {
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

        const contactRequest2 = Schema.create.dapobject('contact');
        contactRequest2.contact.hdextpubkey = user1HDKey
            .derive(derivingPath).hdPublicKey.toString();
        contactRequest2.contact.relation = otherUserId.txid;
        return expect(updateUserState(dashPayId, blockchainUser.regtxid, [contactRequest2], privateKeyString)).to.be.rejectedWith('DAPI RPC error: sendRawTransition: Wasn\'t able to pin packet');
    });


    it('Should go through full accepting contact request process with extra properties', async () => {
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

        contactRequest.contact.extrapropboolean = true;
        contactRequest.contact.extrapropstr = 'stringgg';
        contactRequest.contact.extrapropnum = -1;

        await updateUserState(dashPayId, blockchainUser.regtxid, [contactRequest], privateKeyString);

        await api.generate(1);

        let user1Space = await api.getUserDapSpace(dashPayId, blockchainUser.regtxid);
        expect(user1Space.objects).to.have.lengthOf(1);
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

        const user1Context = await api.getUserDapContext(dashPayId, blockchainUser.regtxid);
        expect(user1Context.dapid).to.equal(dashPayId);
        expect(user1Context.maxidx).to.equal(-1);
        expect(user1Context.objects).to.equal(null);
        expect(user1Context.related).to.have.lengthOf(0);
        expect(user1Context.uid).to.equal(null);

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
        expect(user1Space.objects).to.have.lengthOf(1);
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

    it('Should go through full accepting contact request process', async () => {//aaaaaaaaaaaa
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

        let user1Space = await api.getUserDapSpace(dashPayId, blockchainUser.regtxid);
        expect(user1Space.objects).to.have.lengthOf(1);
        expect(user1Space.objects[0]).to.be.deep.equal({
            "contact": {
                "act": 1,
                "idx": 0,
                "rev": 0,
                "relation": otherUserId.txid,
                "hdextpubkey": contactRequest.contact.hdextpubkey
            }
        });

        let user2Space = await api.getUserDapSpace(dashPayId, otherUserId.txid);
        expect(user2Space).to.equal(undefined);

        let user1Context = await api.getUserDapContext(dashPayId, blockchainUser.regtxid);
        expect(user1Context.dapid).to.equal(dashPayId);
        expect(user1Context.maxidx).to.equal(-1);
        expect(user1Context.objects).to.equal(null);
        expect(user1Context.related).to.have.lengthOf(0);
        expect(user1Context.uid).to.equal(null);

        let user2Context = await api.getUserDapContext(dashPayId, otherUserId.txid);
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

        user1Context = await api.getUserDapContext(dashPayId, blockchainUser.regtxid);
        expect(user1Context.dapid).to.equal(dashPayId);
        expect(user1Context.maxidx).to.equal(-1);
        expect(user1Context.objects).to.equal(null);
        expect(user1Context.related).to.have.lengthOf(0);
        expect(user1Context.uid).to.equal(null);

        user2Context = await api.getUserDapContext(dashPayId, otherUserId.txid);
        expect(user2Context.dapid).to.equal(dashPayId);
        expect(user2Context.maxidx).to.equal(-1);
        expect(user2Context.objects).to.have.lengthOf(1);
        expect(user2Context.objects[0]).to.be.deep.equal({
            "contact": {
                "act": 1,
                "hdextpubkey": contactAcceptance.contact.hdextpubkey,
                "idx": 0,
                "relation": user1Space.uid,
                "rev": 0
            }
        });
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

        user2Space = await api.getUserDapSpace(dashPayId, otherUserId.txid);
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

        blockchainUser = await api.getUserByName(username);
        expect(blockchainUser.subtx).to.have.lengthOf(2);
        expect(blockchainUser.transitions).to.have.lengthOf(1);

        let otherUser = await api.getUserByName(otherUserUsername);
        expect(otherUser.subtx).to.have.lengthOf(1);
        expect(otherUser.transitions).to.have.lengthOf(1);
    });

    it('Should go through full accepting user request process with extra properties', async () => {
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
        const userRequest = Schema.create.dapobject('user');
        userRequest.user.aboutme = 'This is story about me';
        userRequest.user.avatar = 'My avatar here';
        userRequest.user.extra_property = 'this property was not defined in schema';

        await updateUserState(dashPayId, blockchainUser.regtxid, [userRequest], privateKeyString);
        await api.generate(1);

        let user1Space = await api.getUserDapSpace(dashPayId, blockchainUser.regtxid);
        expect(user1Space.dapid).to.be.deep.equal(dashPayId);
        expect(user1Space.objects).to.have.lengthOf(1);
        expect(user1Space.objects[0]).to.be.deep.equal({
            "user": {
                "act": 1,
                "idx": 0,
                "rev": 0,
                "avatar": "My avatar here",
                "aboutme": "This is story about me",
                "extra_property": "this property was not defined in schema"
            }
        });

        const user2Context = await api.getUserDapContext(dashPayId, otherUserId.txid);
        expect(user2Context.dapid).to.equal(dashPayId);
        expect(user2Context.maxidx).to.equal(-1);
        expect(user2Context.objects).to.equal(null);
        expect(user2Context.related).to.have.lengthOf(0);

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
        const userRequest = Schema.create.dapobject('user');

        userRequest.user.aboutme = 'This is story about me';
        userRequest.user.avatar = 'My avatar here';
        await updateUserState(dashPayId, blockchainUser.regtxid, [userRequest], privateKeyString);
        await api.generate(1);

        let user1Space = await api.getUserDapSpace(dashPayId, blockchainUser.regtxid);
        expect(user1Space.dapid).to.be.deep.equal(dashPayId);
        expect(user1Space.objects).to.have.lengthOf(1);
        expect(user1Space.objects[0]).to.be.deep.equal({
            "user": {
                "act": 1,
                "idx": 0,
                "rev": 0,
                "avatar": "My avatar here",
                "aboutme": "This is story about me"
            }
        });

        const user2Context = await api.getUserDapContext(dashPayId, otherUserId.txid);
        expect(user2Context.dapid).to.equal(dashPayId);
        expect(user2Context.maxidx).to.equal(-1);
        expect(user2Context.objects).to.equal(null);
        expect(user2Context.related).to.have.lengthOf(0);

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
                "aboutme": "This is story about me"
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

    it('Should go through full accepting user request process without properties', async () => {
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
        const userRequest = Schema.create.dapobject('user');

        await updateUserState(dashPayId, blockchainUser.regtxid, [userRequest], privateKeyString);
        await api.generate(1);

        let user1Space = await api.getUserDapSpace(dashPayId, blockchainUser.regtxid);
        expect(user1Space.dapid).to.be.deep.equal(dashPayId);
        expect(user1Space.objects).to.have.lengthOf(1);
        expect(user1Space.objects[0]).to.be.deep.equal({
            "user": {
                "act": 1,
                "idx": 0,
                "rev": 0
            }
        });

        const user2Context = await api.getUserDapContext(dashPayId, otherUserId.txid);
        expect(user2Context.dapid).to.equal(dashPayId);
        expect(user2Context.maxidx).to.equal(-1);
        expect(user2Context.objects).to.equal(null);
        expect(user2Context.related).to.have.lengthOf(0);

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

    it('Should go through full accepting store request process with extra properties', async () => {
        const username = Math.random().toString(36).substring(7);
        await registerUser(username, privateKeyString);
        await api.generate(1);
        let blockchainUser = await api.getUserByName(username);
        const otherUserUsername = Math.random().toString(36).substring(7);
        const otherUserId = await registerUser(otherUserUsername, privateKeyString);
        await topUpUserCredits(blockchainUser.regtxid, privateKeyString);
        await api.generate(1);
        blockchainUser = await api.getUserByName(username);
        let dashPayDataContract = await api.getDapContract(dashPayId);
        if (!dashPayDataContract) {
            dashPayId = await registerDap(
                Schema.Daps.DashPay,
                privateKeyString,
                blockchainUser.regtxid,
            );
            await api.generate(1);
            dashPayDataContract = await api.getDapContract(dashPayId);
        }

        const storeRequest = Schema.create.dapobject('store');
        storeRequest.store.storename = 999;
        storeRequest.store.extra_property = "Why we allow to set extra property";

        await updateUserState(dashPayId, blockchainUser.regtxid, [storeRequest], privateKeyString);
        await api.generate(1);

        let user1Space = await api.getUserDapSpace(dashPayId, blockchainUser.regtxid);
        expect(user1Space.dapid).to.be.deep.equal(dashPayId);
        expect(user1Space.objects).to.have.lengthOf(1);
        expect(user1Space.objects[0]).to.be.deep.equal({
            "store": {
                "act": 1,
                "extra_property": "Why we allow to set extra property",
                "idx": 0,
                "storename": 999,
                "rev": 0
            }
        });

        const user2Context = await api.getUserDapContext(dashPayId, otherUserId.txid);
        expect(user2Context.dapid).to.equal(dashPayId);
        expect(user2Context.maxidx).to.equal(-1);
        expect(user2Context.objects).to.equal(null);
        expect(user2Context.related).to.have.lengthOf(0);

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
        let blockchainUser = await api.getUserByName(username);
        const otherUserUsername = Math.random().toString(36).substring(7);
        const otherUserId = await registerUser(otherUserUsername, privateKeyString);
        await topUpUserCredits(blockchainUser.regtxid, privateKeyString);
        await api.generate(1);
        blockchainUser = await api.getUserByName(username);
        let dashPayDataContract = await api.getDapContract(dashPayId);
        if (!dashPayDataContract) {
            dashPayId = await registerDap(
                Schema.Daps.DashPay,
                privateKeyString,
                blockchainUser.regtxid,
            );
            await api.generate(1);
        }

        const storeRequest = Schema.create.dapobject('store');
        storeRequest.store.storename = 999;

        await updateUserState(dashPayId, blockchainUser.regtxid, [storeRequest], privateKeyString);
        await api.generate(1);

        let user1Space = await api.getUserDapSpace(dashPayId, blockchainUser.regtxid);
        expect(user1Space.dapid).to.be.deep.equal(dashPayId);
        expect(user1Space.objects).to.have.lengthOf(1);
        expect(user1Space.objects[0]).to.be.deep.equal({
            "store": {
                "act": 1,
                "idx": 0,
                "rev": 0,
                "storename": 999
            }
        });

        const user2Context = await api.getUserDapContext(dashPayId, otherUserId.txid);
        expect(user2Context.dapid).to.equal(dashPayId);
        expect(user2Context.maxidx).to.equal(-1);
        expect(user2Context.objects).to.equal(null);
        expect(user2Context.related).to.have.lengthOf(0);

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

    it('Should go through full accepting store request process without properties', async () => {
        const username = Math.random().toString(36).substring(7);
        await registerUser(username, privateKeyString);
        await api.generate(1);
        let blockchainUser = await api.getUserByName(username);
        const otherUserUsername = Math.random().toString(36).substring(7);
        const otherUserId = await registerUser(otherUserUsername, privateKeyString);
        await topUpUserCredits(blockchainUser.regtxid, privateKeyString);
        await api.generate(1);
        blockchainUser = await api.getUserByName(username);
        let dashPayDataContract = await api.getDapContract(dashPayId);
        if (!dashPayDataContract) {
            dashPayId = await registerDap(
                Schema.Daps.DashPay,
                privateKeyString,
                blockchainUser.regtxid,
            );
            await api.generate(1);
            dashPayDataContract = await api.getDapContract(dashPayId);
        }

        const storeRequest = Schema.create.dapobject('store');
        await updateUserState(dashPayId, blockchainUser.regtxid, [storeRequest], privateKeyString);
        await api.generate(1);

        let user1Space = await api.getUserDapSpace(dashPayId, blockchainUser.regtxid);
        expect(user1Space.dapid).to.be.deep.equal(dashPayId);
        expect(user1Space.objects).to.have.lengthOf(1);
        expect(user1Space.objects[0]).to.be.deep.equal({
            "store": {
                "act": 1,
                "idx": 0,
                "rev": 0
            }
        });

        const user2Context = await api.getUserDapContext(dashPayId, otherUserId.txid);
        expect(user2Context.dapid).to.equal(dashPayId);
        expect(user2Context.maxidx).to.equal(-1);
        expect(user2Context.objects).to.equal(null);
        expect(user2Context.related).to.have.lengthOf(0);

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
            }
        });

        const user2Space = await api.getUserDapSpace(dashPayId, otherUserId.txid);
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


    it('Should not be able to update user state with invalid parameter type', async () => {
        const username = Math.random().toString(36).substring(7);
        await registerUser(username, privateKeyString);
        await api.generate(1);
        let blockchainUser = await api.getUserByName(username);
        const otherUserUsername = Math.random().toString(36).substring(7);
        const otherUserId = await registerUser(otherUserUsername, privateKeyString);
        await topUpUserCredits(blockchainUser.regtxid, privateKeyString);
        await api.generate(1);
        blockchainUser = await api.getUserByName(username);
        let dashPayDataContract = await api.getDapContract(dashPayId);
        if (!dashPayDataContract) {
            dashPayId = await registerDap(
                Schema.Daps.DashPay,
                privateKeyString,
                blockchainUser.regtxid,
            );
            await api.generate(1);
        }

        const storeRequest = Schema.create.dapobject('store');
        storeRequest.store.storename = "999";
        return expect(updateUserState(dashPayId, blockchainUser.regtxid, [storeRequest], privateKeyString)).to.be.rejectedWith('DAPI RPC error: sendRawTransition: Wasn\'t able to pin packet');
    });
});
