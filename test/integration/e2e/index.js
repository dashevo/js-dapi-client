require('../../bootstrap');

const path = require('path');
const dotenvSafe = require('dotenv-safe');

const sinon = require('sinon');

const MNDiscovery = require('../../../src/MNDiscovery/index');
const {startDapi} = require('@dashevo/js-evo-services-ctl');
const DAPIClient = require('../../../src/index');

const DashPlatformProtocol = require('@dashevo/dpp');
const entropy = require('@dashevo/dpp/lib/util/entropy');
const DPObject = require('@dashevo/dpp/lib/object/DPObject');

const {
    Transaction,
    PrivateKey,
    PublicKey,
    Address,
} = require('@dashevo/dashcore-lib');

// const Schema = require('@dashevo/dash-schema/dash-schema-lib');
// const DashPay = require('@dashevo/dash-schema/dash-core-daps');
//
// const doubleSha256 = require('../../utils/doubleSha256');
const wait = require('../../utils/wait');

process.env.NODE_ENV = 'test';

dotenvSafe.config({
    sample : path.resolve(__dirname, '../.env'),
    path: path.resolve(__dirname, '../.env'),
});

describe('basic E2E tests', () => {
    let masterNode;

    const attempts = 30;

    let dpp;

    let dapiClient;
    // let dapId;
    // let dapSchema;
    // let dapContract;

    let faucetPrivateKey;
    let faucetAddress;

    let bobPrivateKey;
    let bobUserName;
    let bobRegTxId;
    let alicePrivateKey;
    let aliceUserName;
    let aliceRegTxId;

    let aliceUser;
    let aliceContactAcceptance;

    let bobPreviousST;
    let alicePreviousST;

    before(async () => {
        dpp = new DashPlatformProtocol();
        const privKey = "cVwyvFt95dzwEqYCLd8pv9CzktajP4tWH2w9RQNPeHYA7pH35wcJ";
        faucetPrivateKey = new PrivateKey(privKey);

        const faucetPublicKey = PublicKey.fromPrivateKey(faucetPrivateKey);

        faucetAddress = Address
            .fromPublicKey(faucetPublicKey, 'testnet')
            .toString();

        bobUserName = Math.random().toString(36).substring(7);
        aliceUserName = Math.random().toString(36).substring(7);
        // dapSchema = Object.assign({}, DashPay);
        // dapSchema.title = `TestContacts_${bobUserName}`;
        //
        // dapContract = Schema.create.dapcontract(dapSchema);
        // dapId = doubleSha256(Schema.serialize.encode(dapContract.dapcontract));

        const dpContract = dpp.contract.create(entropy.generate(), {
            user: {
                properties: {
                    avatarUrl: {
                        type: 'string',
                        format: 'url',
                    },
                    about: {
                        type: 'string',
                    },
                },
                required: ['avatarUrl', 'about'],
                additionalProperties: false,
            },
            contact: {
                properties: {
                    toUserId: {
                        type: 'string',
                    },
                    publicKey: {
                        type: 'string',
                    },
                },
                required: ['toUserId', 'publicKey'],
                additionalProperties: false,
            },
        });

        dpp.setDPContract(dpContract);

        sinon.stub(MNDiscovery.prototype, 'getRandomMasternode')
            .returns(Promise.resolve({ip: '127.0.0.1'}));

        [masterNode] = await startDapi.many(1);

        const seeds = [{ip: masterNode.dapi.container.getIp()}]; //, { ip: master2.dapi.container.getIp()}];
        await masterNode.dashCore.getApi().generate(1500);

        dapiClient = new DAPIClient({
            seeds,
            port: masterNode.dapi.options.getRpcPort(),
        });

        // dash-cli -regtest -rpcuser=dashrpc -rpcpassword=password -rpcport=21456 sendtoaddress ygPcCwVy7Fxg7ruxZzqVYdPLtvw7auHAFh 1

        await masterNode.dashCore.getApi().sendToAddress(faucetAddress, 100);
        await dapiClient.generate(20);

    });

    after('cleanup lone services', async () => {
        const instances = [
            masterNode,
        ];

        await Promise.all(instances.filter(i => i)
            .map(i => i.remove()));

        MNDiscovery.prototype.getRandomMasternode.restore();
    });

    describe('Bob', () => {
        it('should register blockchain user', async function it() {
            this.timeout(50000);

            bobPrivateKey = new PrivateKey();
            const validPayload = new Transaction.Payload.SubTxRegisterPayload()
                .setUserName(bobUserName)
                .setPubKeyIdFromPrivateKey(bobPrivateKey).sign(bobPrivateKey);


            let inputs = await dapiClient.getUTXO(faucetAddress);

            const transaction = Transaction()
                .setType(Transaction.TYPES.TRANSACTION_SUBTX_REGISTER)
                .setExtraPayload(validPayload)
                .from(inputs.slice(-1)[0])
                .addFundingOutput(10000)
                .change(faucetAddress)
                .sign(faucetPrivateKey);

            bobRegTxId = await dapiClient.sendRawTransaction(transaction.serialize());

            bobPreviousST = bobRegTxId;

            await dapiClient.generate(1);
            await wait(5000);

            const userByName = await dapiClient.getUserByName(bobUserName);
            expect(userByName.uname).to.be.equal(bobUserName);

        });

        it('should publish "Contacts" contract', async function it() {
            // 1. Create ST packet
            // let {stpacket: stPacket} = Schema.create.stpacket();
            // stPacket = Object.assign(stPacket, dapContract);
            const stPacket = dpp.packet.create(dpp.getDPContract());

            // 2. Create State Transition
            const transaction = new Transaction()
                .setType(Transaction.TYPES.TRANSACTION_SUBTX_TRANSITION);

            // const serializedPacket = Schema.serialize.encode(stPacket);
            // const stPacketHash = doubleSha256(serializedPacket);

            transaction.extraPayload
                .setRegTxId(bobRegTxId)
                .setHashPrevSubTx(bobPreviousST)
                .setHashSTPacket(stPacket.hash())
                .setCreditFee(1000)
                .sign(bobPrivateKey);

            const transitionHash = await dapiClient.sendRawTransition(
                transaction.serialize(),
                stPacket.serialize().toString('hex'),
            );

            expect(transitionHash).to.be.a('string');
            expect(transitionHash).to.be.not.empty();

            bobPreviousST = transitionHash;

            let dpContract;
            await wait(5000);
            for (let i = 0; i <= attempts; i++) {
                try {
                    // waiting for Contacts to be added
                    dpContract = await dapiClient.fetchDapContract(dpp.getDPContract().getId());
                    break;
                } catch (e) {
                    await dapiClient.generate(1);
                }
            }

            // expect(dapContractFromDAPI).to.have.property('dapname');
            // expect(dapContractFromDAPI.dapname).to.be.equal(dapSchema.title);
            expect(dpContract).to.be.deep.equal(dpp.getDPContract().getId());
        });

        it('should create profile in "Contacts" app', async function it() {
            // const userRequest = Schema.create.dapobject('user');
            // userRequest.aboutme = 'This is story about me';
            // userRequest.avatar = 'My avatar here';
            // userRequest.act = 0;

            dpp.setUserId(bobRegTxId);

            const user = dpp.object.create('user', {
                avatarUrl: 'http://test.com/bob.jpg',
                about: 'This is story about me',
            });

            // 1. Create ST profile packet
            // const {stpacket: stPacket} = Schema.create.stpacket();
            // stPacket.dapobjects = [userRequest];
            // stPacket.dapid = dapId;
            const stPacket = dpp.packet.create([user]);

            // 2. Create State Transition
            const transaction = new Transaction()
                .setType(Transaction.TYPES.TRANSACTION_SUBTX_TRANSITION);

            // const serializedPacket = Schema.serialize.encode(stPacket);
            // const stPacketHash = doubleSha256(serializedPacket);

            transaction.extraPayload
                .setRegTxId(bobRegTxId)
                .setHashPrevSubTx(bobPreviousST)
                .setHashSTPacket(stPacket.hash())
                .setCreditFee(1000)
                .sign(bobPrivateKey);

            const transitionHash = await dapiClient.sendRawTransition(
                transaction.serialize(),
              stPacket.serialize().toString('hex'),
            );

            expect(transitionHash).to.be.a('string');
            expect(transitionHash).to.be.not.empty();

            bobPreviousST = transitionHash;

            let users;
            for (let i = 0; i <= attempts; i++) {
                // bobSpace = await dapiClient.fetchDapObjects(dapId, 'user', {});
                users = await dapiClient.fetchDapObjects(
                  dpp.getDPContract().getId(),
                  'user',
                  {},
                );
                // waiting for Bob's profile to be added
                if (users.length > 0) {
                    break;
                } else {
                    await dapiClient.generate(1);
                }
            }

            // expect(bobSpace).to.have.lengthOf(1);
            // TODO why?
            // expect(bobSpace[0].blockchainUserId).to.be.equal(bobRegTxId);
            // expect(bobSpace[0]).to.be.deep.equal(
            //     {
            //         act: 0,
            //         idx: 0,
            //         rev: 0,
            //         avatar: 'My avatar here',
            //         aboutme: 'This is story about me',
            //         pver: null,
            //         objtype: 'user',
            //     },
            // );
            expect(users).to.have.lengthOf(1);
            expect(users[0]).to.be.deep.equal(user.toJSON());
        });
    });

    describe('Alice', () => {
        it('should register blockchain user', async function it() {
            this.timeout(50000);

            const seeds = [{ip: masterNode.dapi.container.getIp()}];
            await masterNode.dashCore.getApi().generate(500);

            let count = await masterNode.dashCore.getApi().getBlockCount();

            let result = await masterNode.dashCore.getApi().sendToAddress(faucetAddress, 100);

            await dapiClient.generate(20);

            alicePrivateKey = new PrivateKey();
            const validPayload = new Transaction.Payload.SubTxRegisterPayload()
                .setUserName(aliceUserName)
                .setPubKeyIdFromPrivateKey(alicePrivateKey).sign(alicePrivateKey);

            let inputs = await dapiClient.getUTXO(faucetAddress);
            expect(inputs).to.have.lengthOf(2);

            const transaction = Transaction()
                .setType(Transaction.TYPES.TRANSACTION_SUBTX_REGISTER)
                .setExtraPayload(validPayload)
                .from(inputs.slice(-1)[0])
                .addFundingOutput(10000)
                .change(faucetAddress)
                .sign(faucetPrivateKey);

            aliceRegTxId = await dapiClient.sendRawTransaction(transaction.serialize());

            alicePreviousST = aliceRegTxId;

            // await dapiClient.generate(1);
            await wait(5000);//why we don't generate block and it works?

            const userByName = await dapiClient.getUserByName(aliceUserName);

            expect(userByName.uname).to.be.equal(aliceUserName);
        });

        it('should create profile in "Contacts" app', async function it() {
            // const userRequest = Schema.create.dapobject('user');
            // userRequest.aboutme = 'I am Alice';
            // userRequest.avatar = 'Alice\'s avatar here';
            // userRequest.act = 0;

            dpp.setUserId(aliceRegTxId);

            aliceUser = dpp.object.create('user', {
                avatarUrl: 'http://test.com/alice.jpg',
                about: 'I am Alice',
            });

            // 1. Create ST user packet
            // const {stpacket: stPacket} = Schema.create.stpacket();
            // stPacket.dapobjects = [userRequest];
            // stPacket.dapid = dapId;
            const stPacket = dpp.packet.create([aliceUser]);

            // 2. Create State Transition
            const transaction = new Transaction()
                .setType(Transaction.TYPES.TRANSACTION_SUBTX_TRANSITION);

            // const serializedPacket = Schema.serialize.encode(stPacket);
            // const stPacketHash = doubleSha256(serializedPacket);

            transaction.extraPayload
                .setRegTxId(aliceRegTxId)
                .setHashPrevSubTx(alicePreviousST)
                .setHashSTPacket(stPacket.hash())
                .setCreditFee(1000)
                .sign(alicePrivateKey);

            const transitionHash = await dapiClient.sendRawTransition(
                transaction.serialize(),
                stPacket.serialize().toString('hex'),
            );

            expect(transitionHash).to.be.a('string');
            expect(transitionHash).to.be.not.empty();

            alicePreviousST = transitionHash;

            let users;
            for (let i = 0; i <= attempts; i++) {
                // aliceSpace = await dapiClient.fetchDapObjects(dapId, 'user', {});
                users = await dapiClient.fetchDapObjects(
                  dpp.getDPContract().getId(),
                  'user',
                  {},
                );
                // waiting for Alice's profile to be added
                if (users.length > 1) {
                    break;
                } else {
                    await dapiClient.generate(1);
                }
            }

            // expect(aliceSpace).to.have.lengthOf(2);
            // expect(aliceSpace[1].blockchainUserId).to.be.equal(aliceRegTxId); // TODO why?
            // expect(aliceSpace[1]).to.be.deep.equal(
            //     {
            //         act: 0,
            //         idx: 0,
            //         rev: 0,
            //         avatar: 'Alice\'s avatar here',
            //         aboutme: 'I am Alice',
            //         pver: null,
            //         objtype: 'user',
            //     },
            // );
            expect(users).to.have.lengthOf(2);
            expect(users[1]).to.be.deep.equal(aliceUser.toJSON());
        });

        it('should be able to update her profile', async function it() {
            // const userRequest = Schema.create.dapobject('user');
            // userRequest.aboutme = 'I am Alice2';
            // userRequest.avatar = 'Alice\'s avatar here2';
            dpp.setUserId(aliceRegTxId);

            aliceUser.setAction(DPObject.ACTIONS.UPDATE);
            aliceUser.set('avatarUrl', 'http://test.com/alice2.jpg');

            // 1. Create ST update profile packet
            // const {stpacket: stPacket} = Schema.create.stpacket();
            // stPacket.dapobjects = [userRequest];
            // stPacket.dapid = dapId;
            const stPacket = dpp.packet.create([aliceUser]);

            // 2. Create State Transition
            const transaction = new Transaction()
                .setType(Transaction.TYPES.TRANSACTION_SUBTX_TRANSITION);

            // const serializedPacket = Schema.serialize.encode(stPacket);
            // const stPacketHash = doubleSha256(serializedPacket);

            transaction.extraPayload
                .setRegTxId(aliceRegTxId)
                .setHashPrevSubTx(alicePreviousST)
                .setHashSTPacket( stPacket.serialize().toString('hex'))
                .setCreditFee(1000)
                .sign(alicePrivateKey);

            const transitionHash = await dapiClient.sendRawTransition(
                transaction.serialize(),
                serializedPacket.toString('hex'),
            );

            expect(transitionHash).to.be.a('string');
            expect(transitionHash).to.be.not.empty();

            alicePreviousST = transitionHash;

            let users;
            for (let i = 0; i <= attempts; i++) {
                // aliceSpace = await dapiClient.fetchDapObjects(dapId, 'user', {});
                users = await dapiClient.fetchDapObjects(
                  dpp.getDPContract().getId(),
                  'user',
                  {},
                );
                // waiting for Alice's profile modified
                if (users.length === 2 && users[1].act === 1) {
                    break;
                } else {
                    await dapiClient.generate(1);
                }
            }

            // expect(aliceSpace).to.have.lengthOf(2);
            // expect(aliceSpace[1].blockchainUserId).to.be.equal(aliceRegTxId);
            // expect(aliceSpace[1]).to.be.deep.equal(
            //     {
            //         act: 1,
            //         idx: 0,
            //         rev: 0,
            //         avatar: 'Alice\'s avatar here2',
            //         aboutme: 'I am Alice2',
            //         pver: null,
            //         objtype: 'user',
            //     },
            // );
            expect(users).to.have.lengthOf(2);
            expect(users[1]).to.be.deep.equal(aliceUser.toJSON());
        });
    });

    describe('Bob', () => {
        it('should be able to send contact request', async function it() {
            // const bobContactRequest = Schema.create.dapobject('contact');
            // bobContactRequest.hdextpubkey = bobPrivateKey.toPublicKey().toString('hex');
            // bobContactRequest.relation = aliceRegTxId;
            // bobContactRequest.act = 0;

            dpp.setUserId(bobRegTxId);

            const contactRequest = dpp.object.create('contact', {
                toUserId: aliceRegTxId,
                publicKey: bobPrivateKey.toPublicKey().toString('hex'),
            });

            // 1. Create ST contact request packet
            // const {stpacket: stPacket} = Schema.create.stpacket();
            // stPacket.dapobjects = [bobContactRequest];
            // stPacket.dapid = dapId;
            const stPacket = dpp.packet.create([contactRequest]);

            // 2. Create State Transition
            const transaction = new Transaction()
                .setType(Transaction.TYPES.TRANSACTION_SUBTX_TRANSITION);

            // const serializedPacket = Schema.serialize.encode(stPacket);
            // const stPacketHash = doubleSha256(serializedPacket);

            transaction.extraPayload
                .setRegTxId(bobRegTxId)
                .setHashPrevSubTx(bobPreviousST)
                .setHashSTPacket(stPacket.hash())
                .setCreditFee(1000)
                .sign(bobPrivateKey);

            const transitionHash = await dapiClient.sendRawTransition(
                transaction.serialize(),
              stPacket.serialize().toString('hex'),
            );

            expect(transitionHash).to.be.a('string');
            expect(transitionHash).to.be.not.empty();

            bobPreviousST = transitionHash;

            let contacts;
            for (let i = 0; i <= attempts; i++) {
                // bobContact = await dapiClient.fetchDapObjects(dapId, 'contact', {});
                contacts = await dapiClient.fetchDapObjects(
                  dpp.getDPContract().getId(),
                  'contact',
                  {},
                );
                // waiting for Bob's contact request to be added
                if (contacts.length > 0) {
                    break;
                } else {
                    await dapiClient.generate(1);
                }
            }

            // expect(bobContact).to.have.lengthOf(1);
            // expect(bobContact[0].blockchainUserId).to.be.equal(bobRegTxId);
            // expect(bobContact[0]).to.be.deep.equal(
            //     {
            //         act: 0,
            //         idx: 0,
            //         rev: 0,
            //         objtype: 'contact',
            //         relation: aliceRegTxId,
            //         pver: null,
            //         hdextpubkey: bobContactRequest.hdextpubkey,
            //     },
            // );
            expect(contacts).to.have.lengthOf(1);
            expect(contacts[0]).to.be.deep.equal(contactRequest.toJSON());
        });
    });

    describe('Alice', () => {
        it('should be able to approve contact request', async function it() {
            // const contactAcceptance = Schema.create.dapobject('contact');
            // contactAcceptance.hdextpubkey = alicePrivateKey.toPublicKey().toString('hex');
            // contactAcceptance.relation = bobRegTxId;
            dpp.setUserId(aliceRegTxId);

            aliceContactAcceptance = dpp.object.create('contact', {
                toUserId: bobRegTxId,
                publicKey: alicePrivateKey.toPublicKey().toString('hex'),
            });

            // 1. Create ST approve contact packet
            // const {stpacket: stPacket} = Schema.create.stpacket();
            // stPacket.dapobjects = [contactAcceptance];
            // stPacket.dapid = dapId;
            const stPacket = dpp.packet.create([aliceContactAcceptance]);

            // 2. Create State Transition
            const transaction = new Transaction()
                .setType(Transaction.TYPES.TRANSACTION_SUBTX_TRANSITION);

            // const serializedPacket = Schema.serialize.encode(stPacket);
            // const stPacketHash = doubleSha256(serializedPacket);

            transaction.extraPayload
                .setRegTxId(aliceRegTxId)
                .setHashPrevSubTx(alicePreviousST)
                .setHashSTPacket(stPacket.hash())
                .setCreditFee(1000)
                .sign(alicePrivateKey);

            const transitionHash = await dapiClient.sendRawTransition(
                transaction.serialize(),
              stPacket.serialize().toString('hex'),
            );

            expect(transitionHash).to.be.a('string');
            expect(transitionHash).to.be.not.empty();

            alicePreviousST = transitionHash;

            let contacts;
            for (let i = 0; i <= attempts; i++) {
                // aliceContact = await dapiClient.fetchDapObjects(dapId, 'contact', {});
                contacts = await dapiClient.fetchDapObjects(
                  dpp.getDPContract().getId(),
                  'contact',
                  {},
                );
                // waiting for Bob's contact to be approved from Alice
                if (contacts.length > 1) {
                    break;
                } else {
                    await dapiClient.generate(1);
                }
            }

            // expect(aliceContact).to.have.lengthOf(2);
            // expect(aliceContact[0].blockchainUserId).to.be.equal(bobRegTxId);
            // expect(aliceContact[1].blockchainUserId).to.be.equal(aliceRegTxId);
            // expect(aliceContact[1]).to.be.deep.equal(
            //     {
            //         act: 1,
            //         idx: 0,
            //         rev: 0,
            //         objtype: 'contact',
            //         relation: bobRegTxId,
            //         pver: null,
            //         hdextpubkey: contactAcceptance.hdextpubkey,
            //     },
            // );
            expect(contacts).to.have.lengthOf(2);
            expect(contacts[1]).to.be.deep.equal(aliceContactAcceptance.toJSON());
        });

        it('should be able to remove contact approvement', async function it() {
            // const contactDeleteRequest = Schema.create.dapobject('contact');
            // contactDeleteRequest.hdextpubkey = alicePrivateKey.toPublicKey().toString('hex');
            // contactDeleteRequest.relation = bobRegTxId;
            // contactDeleteRequest.act = 2;
            dpp.setUserId(aliceRegTxId);

            aliceContactAcceptance.setAction(DPObject.ACTIONS.DELETE);

            // 1. Create ST contact delete packet
            // const {stpacket: stPacket} = Schema.create.stpacket();
            // stPacket.dapobjects = [contactDeleteRequest];
            // stPacket.dapid = dapId;
            const stPacket = dpp.packet.create([aliceContactAcceptance]);

            // 2. Create State Transition
            const transaction = new Transaction()
                .setType(Transaction.TYPES.TRANSACTION_SUBTX_TRANSITION);

            // const serializedPacket = Schema.serialize.encode(stPacket);
            // const stPacketHash = doubleSha256(serializedPacket);

            transaction.extraPayload
                .setRegTxId(aliceRegTxId)
                .setHashPrevSubTx(alicePreviousST)
                .setHashSTPacket(stPacket.hash())
                .setCreditFee(1000)
                .sign(alicePrivateKey);

            const transitionHash = await dapiClient.sendRawTransition(
                transaction.serialize(),
              stPacket.serialize().toString('hex'),
            );

            expect(transitionHash).to.be.a('string');
            expect(transitionHash).to.be.not.empty();

            alicePreviousST = transitionHash;

            let contacts;
            for (let i = 0; i <= attempts; i++) {
                // waiting for Bob's contact to be deleted from Alice
                // aliceContact = await dapiClient.fetchDapObjects(dapId, 'contact', {});
                contacts = await dapiClient.fetchDapObjects(
                  dpp.getDPContract().getId(),
                  'contact',
                  {},
                );
                if (contacts.length === 1) {
                    break;
                } else {
                    await dapiClient.generate(1);
                }
            }

            // expect(aliceContact).to.have.lengthOf(1);
            // expect(aliceContact[0].blockchainUserId).to.be.equal(bobRegTxId);
            // expect(aliceContact[0]).to.be.deep.equal(
            //     {
            //         act: 0,
            //         idx: 0,
            //         rev: 0,
            //         objtype: 'contact',
            //         relation: aliceRegTxId,
            //         pver: null,
            //         hdextpubkey: bobPrivateKey.toPublicKey().toString('hex'),
            //     },
            // );
            expect(contacts).to.have.lengthOf(1);
            expect(contacts[0]).to.be.deep.equal(aliceContactAcceptance.toJSON());
        });
    });

});
