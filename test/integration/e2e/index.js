require('../utils/bootstrap');
const {startDapi} = require('@dashevo/js-evo-services-ctl');
const DAPIClient = require('../../../src/index');

const {
    Transaction,
    PrivateKey,
    PublicKey,
    Address,
} = require('@dashevo/dashcore-lib');

const Schema = require('@dashevo/dash-schema/dash-schema-lib');
const DashPay = require('@dashevo/dash-schema/dash-core-daps');

const doubleSha256 = require('../utils/doubleSha256');
const wait = require('../utils/wait');


describe('basic E2E tests', () => {
    let master1;

    const attempts = 400;
    const testTimeout = 1200000;

    let dapiClient;
    let dapId;
    let dapSchema;
    let dapContract;

    let faucetPrivateKey;
    let faucetAddress;

    let bobPrivateKey;
    let bobUserName;
    let bobRegTxId;
    let alicePrivateKey;
    let aliceUserName;
    let aliceRegTxId;

    let bobPreviousST;
    let alicePreviousST;

    before(async () => {
        const privKey = "cVwyvFt95dzwEqYCLd8pv9CzktajP4tWH2w9RQNPeHYA7pH35wcJ";
        faucetPrivateKey = new PrivateKey(privKey);

        const faucetPublicKey = PublicKey.fromPrivateKey(faucetPrivateKey);

        faucetAddress = Address
            .fromPublicKey(faucetPublicKey, 'testnet')
            .toString();

        bobUserName = Math.random().toString(36).substring(7);
        aliceUserName = Math.random().toString(36).substring(7);
        dapSchema = Object.assign({}, DashPay);
        dapSchema.title = `TestContacts_${bobUserName}`;

        dapContract = Schema.create.dapcontract(dapSchema);
        dapId = doubleSha256(Schema.serialize.encode(dapContract.dapcontract));


        [master1] = await startDapi.many(1);

        const seeds = [{ip: master1.dapi.container.getIp()}]; //, { ip: master2.dapi.container.getIp()}];
        await master1.dashCore.getApi().generate(1500);

        let count = await master1.dashCore.getApi().getBlockCount();
        //2 core -> connect -> spork
        // let countMn = await master1.dashCore.getMNList();
        dapiClient = new DAPIClient({
            seeds,
            port: master1.dapi.options.getRpcPort(),
        });

        // dash-cli -regtest -rpcuser=dashrpc -rpcpassword=password -rpcport=21456 sendtoaddress ygPcCwVy7Fxg7ruxZzqVYdPLtvw7auHAFh 1

        await master1.dashCore.getApi().sendToAddress(faucetAddress, 100);
        await dapiClient.generate(20);
        let result = await master1.dashCore.getApi().getAddressUtxos({"addresses": ["ygPcCwVy7Fxg7ruxZzqVYdPLtvw7auHAFh"]});

    });

    after('cleanup lone services', async () => {
        const instances = [
            master1,
        ];

        await Promise.all(instances.filter(i => i)
            .map(i => i.remove()));
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

            ({txid: bobRegTxId} = await dapiClient.sendRawTransaction(transaction.serialize()));

            bobPreviousST = bobRegTxId;

            await dapiClient.generate(1);
            await wait(5000);

            const userByName = await dapiClient.getUserByName(bobUserName);
            expect(userByName.uname).to.be.equal(bobUserName);

        });

        it('should publish "Contacts" contract', async function it() {
            this.timeout(testTimeout);

            // 1. Create ST packet
            let {stpacket: stPacket} = Schema.create.stpacket();
            stPacket = Object.assign(stPacket, dapContract);

            // 2. Create State Transition
            const transaction = new Transaction()
                .setType(Transaction.TYPES.TRANSACTION_SUBTX_TRANSITION);

            const serializedPacket = Schema.serialize.encode(stPacket);
            const stPacketHash = doubleSha256(serializedPacket);

            transaction.extraPayload
                .setRegTxId(bobRegTxId)
                .setHashPrevSubTx(bobPreviousST)
                .setHashSTPacket(stPacketHash)
                .setCreditFee(1000)
                .sign(bobPrivateKey);

            const transitionHash = await dapiClient.sendRawTransition(
                transaction.serialize(),
                serializedPacket.toString('hex'),
            );

            expect(transitionHash).to.be.a('string');
            expect(transitionHash).to.be.not.empty();

            bobPreviousST = transitionHash;

            let dapContractFromDAPI;

            for (let i = 0; i <= attempts; i++) {
                try {
                    // waiting for Contacts to be added
                    dapContractFromDAPI = await dapiClient.fetchDapContract(dapId);
                    break;
                } catch (e) {
                    await dapiClient.generate(1);
                }
            }

            expect(dapContractFromDAPI).to.have.property('dapname');
            expect(dapContractFromDAPI.dapname).to.be.equal(dapSchema.title);
        });

        it('should create profile in "Contacts" app', async function it() {
            this.timeout(testTimeout);

            const userRequest = Schema.create.dapobject('user');
            userRequest.aboutme = 'This is story about me';
            userRequest.avatar = 'My avatar here';
            userRequest.act = 0;

            // 1. Create ST profile packet
            const {stpacket: stPacket} = Schema.create.stpacket();
            stPacket.dapobjects = [userRequest];
            stPacket.dapid = dapId;

            // 2. Create State Transition
            const transaction = new Transaction()
                .setType(Transaction.TYPES.TRANSACTION_SUBTX_TRANSITION);

            const serializedPacket = Schema.serialize.encode(stPacket);
            const stPacketHash = doubleSha256(serializedPacket);

            transaction.extraPayload
                .setRegTxId(bobRegTxId)
                .setHashPrevSubTx(bobPreviousST)
                .setHashSTPacket(stPacketHash)
                .setCreditFee(1000)
                .sign(bobPrivateKey);

            const transitionHash = await dapiClient.sendRawTransition(
                transaction.serialize(),
                serializedPacket.toString('hex'),
            );

            expect(transitionHash).to.be.a('string');
            expect(transitionHash).to.be.not.empty();

            bobPreviousST = transitionHash;

            let bobSpace;
            for (let i = 0; i <= attempts; i++) {
                bobSpace = await dapiClient.fetchDapObjects(dapId, 'user', {});
                // waiting for Bob's profile to be added
                if (bobSpace.length > 0) {
                    break;
                } else {
                    await dapiClient.generate(1);
                }
            }

            expect(bobSpace).to.have.lengthOf(1);
            // TODO why?
            // expect(bobSpace[0].blockchainUserId).to.be.equal(bobRegTxId);
            expect(bobSpace[0]).to.be.deep.equal(
                {
                    act: 0,
                    idx: 0,
                    rev: 0,
                    avatar: 'My avatar here',
                    aboutme: 'This is story about me',
                    pver: null,
                    objtype: 'user',
                },
            );
        });
    });

    describe('Alice', () => {
        it('should register blockchain user', async function it() {
            this.timeout(50000);

            const seeds = [{ip: master1.dapi.container.getIp()}];
            await master1.dashCore.getApi().generate(500);

            let count = await master1.dashCore.getApi().getBlockCount();

            let result = await master1.dashCore.getApi().sendToAddress(faucetAddress, 100);

            await dapiClient.generate(20);

            alicePrivateKey = new PrivateKey();
            const validPayload = new Transaction.Payload.SubTxRegisterPayload()
                .setUserName(aliceUserName)
                .setPubKeyIdFromPrivateKey(alicePrivateKey).sign(alicePrivateKey);

            let inputs = await dapiClient.getUTXO(faucetAddress);
            expect(inputs).to.have.lengthOf(2);

            // const {result: inputsCore} = await master1.dashCore.getApi().getAddressUtxos({"addresses": ["ygPcCwVy7Fxg7ruxZzqVYdPLtvw7auHAFh"]});

            // inputs = [
            //     {
            //         "address": "ygPcCwVy7Fxg7ruxZzqVYdPLtvw7auHAFh",
            //         "txid": "01455420c1a190254441fe105da98813796f424c951c60580d56797988b47aa1",
            //         "outputIndex": 1,
            //         "script": "76a914dc2bfda564dc6217c55c842d65cc0242e095d2d788ac",
            //         "satoshis": 9999980000,
            //         "height": 1524
            //     },
            //     {
            //         "address": "ygPcCwVy7Fxg7ruxZzqVYdPLtvw7auHAFh",
            //         "txid": result.result,
            //         "outputIndex": 1,
            //         "script": "76a914dc2bfda564dc6217c55c842d65cc0242e095d2d788ac",
            //         "satoshis": 10000000000,
            //         "height": (count.result + 1)
            //     }
            // ];
            const transaction = Transaction()
                .setType(Transaction.TYPES.TRANSACTION_SUBTX_REGISTER)
                .setExtraPayload(validPayload)
                .from(inputs.slice(-1)[0])
                .addFundingOutput(10000)
                .change(faucetAddress)
                .sign(faucetPrivateKey);

            ({txid: aliceRegTxId} = await dapiClient.sendRawTransaction(transaction.serialize()));

            alicePreviousST = aliceRegTxId;

            // await dapiClient.generate(1);
            await wait(5000);//why we don't generate block and it works?

            const userByName = await dapiClient.getUserByName(aliceUserName);

            expect(userByName.uname).to.be.equal(aliceUserName);
        });

        it('should create profile in "Contacts" app', async function it() {
            this.timeout(testTimeout);

            const userRequest = Schema.create.dapobject('user');
            userRequest.aboutme = 'I am Alice';
            userRequest.avatar = 'Alice\'s avatar here';
            userRequest.act = 0;

            // 1. Create ST user packet
            const {stpacket: stPacket} = Schema.create.stpacket();
            stPacket.dapobjects = [userRequest];
            stPacket.dapid = dapId;

            // 2. Create State Transition
            const transaction = new Transaction()
                .setType(Transaction.TYPES.TRANSACTION_SUBTX_TRANSITION);

            const serializedPacket = Schema.serialize.encode(stPacket);
            const stPacketHash = doubleSha256(serializedPacket);

            transaction.extraPayload
                .setRegTxId(aliceRegTxId)
                .setHashPrevSubTx(alicePreviousST)
                .setHashSTPacket(stPacketHash)
                .setCreditFee(1000)
                .sign(alicePrivateKey);

            const transitionHash = await dapiClient.sendRawTransition(
                transaction.serialize(),
                serializedPacket.toString('hex'),
            );

            expect(transitionHash).to.be.a('string');
            expect(transitionHash).to.be.not.empty();

            alicePreviousST = transitionHash;

            let aliceSpace;
            for (let i = 0; i <= attempts; i++) {
                aliceSpace = await dapiClient.fetchDapObjects(dapId, 'user', {});
                // waiting for Alice's profile to be added
                if (aliceSpace.length > 1) {
                    break;
                } else {
                    await dapiClient.generate(1);
                }
            }

            expect(aliceSpace).to.have.lengthOf(2);
            // expect(aliceSpace[1].blockchainUserId).to.be.equal(aliceRegTxId); // TODO why?
            expect(aliceSpace[1]).to.be.deep.equal(
                {
                    act: 0,
                    idx: 0,
                    rev: 0,
                    avatar: 'Alice\'s avatar here',
                    aboutme: 'I am Alice',
                    pver: null,
                    objtype: 'user',
                },
            );
        });

        it('should be able to update her profile', async function it() {
            this.timeout(testTimeout);

            const userRequest = Schema.create.dapobject('user');
            userRequest.aboutme = 'I am Alice2';
            userRequest.avatar = 'Alice\'s avatar here2';

            // 1. Create ST update profile packet
            const {stpacket: stPacket} = Schema.create.stpacket();
            stPacket.dapobjects = [userRequest];
            stPacket.dapid = dapId;

            // 2. Create State Transition
            const transaction = new Transaction()
                .setType(Transaction.TYPES.TRANSACTION_SUBTX_TRANSITION);

            const serializedPacket = Schema.serialize.encode(stPacket);
            const stPacketHash = doubleSha256(serializedPacket);

            transaction.extraPayload
                .setRegTxId(aliceRegTxId)
                .setHashPrevSubTx(alicePreviousST)
                .setHashSTPacket(stPacketHash)
                .setCreditFee(1000)
                .sign(alicePrivateKey);

            const transitionHash = await dapiClient.sendRawTransition(
                transaction.serialize(),
                serializedPacket.toString('hex'),
            );

            expect(transitionHash).to.be.a('string');
            expect(transitionHash).to.be.not.empty();

            alicePreviousST = transitionHash;

            let aliceSpace;
            for (let i = 0; i <= attempts; i++) {
                aliceSpace = await dapiClient.fetchDapObjects(dapId, 'user', {});
                // waiting for Alice's profile modified
                if (aliceSpace.length === 2 && aliceSpace[1].act === 1) {
                    break;
                } else {
                    await dapiClient.generate(1);
                }
            }

            expect(aliceSpace).to.have.lengthOf(2);
            // expect(aliceSpace[1].blockchainUserId).to.be.equal(aliceRegTxId);
            expect(aliceSpace[1]).to.be.deep.equal(
                {
                    act: 1,
                    idx: 0,
                    rev: 0,
                    avatar: 'Alice\'s avatar here2',
                    aboutme: 'I am Alice2',
                    pver: null,
                    objtype: 'user',
                },
            );
        });
    });

    describe('Bob', () => {
        it('should be able to send contact request', async function it() {
            this.timeout(testTimeout);

            const bobContactRequest = Schema.create.dapobject('contact');
            bobContactRequest.hdextpubkey = bobPrivateKey.toPublicKey().toString('hex');
            bobContactRequest.relation = aliceRegTxId;
            bobContactRequest.act = 0;

            // 1. Create ST contact request packet
            const {stpacket: stPacket} = Schema.create.stpacket();
            stPacket.dapobjects = [bobContactRequest];
            stPacket.dapid = dapId;

            // 2. Create State Transition
            const transaction = new Transaction()
                .setType(Transaction.TYPES.TRANSACTION_SUBTX_TRANSITION);

            const serializedPacket = Schema.serialize.encode(stPacket);
            const stPacketHash = doubleSha256(serializedPacket);

            transaction.extraPayload
                .setRegTxId(bobRegTxId)
                .setHashPrevSubTx(bobPreviousST)
                .setHashSTPacket(stPacketHash)
                .setCreditFee(1000)
                .sign(bobPrivateKey);

            const transitionHash = await dapiClient.sendRawTransition(
                transaction.serialize(),
                serializedPacket.toString('hex'),
            );

            expect(transitionHash).to.be.a('string');
            expect(transitionHash).to.be.not.empty();

            bobPreviousST = transitionHash;

            let bobContact;
            for (let i = 0; i <= attempts; i++) {
                bobContact = await dapiClient.fetchDapObjects(dapId, 'contact', {});
                // waiting for Bob's contact request to be added
                if (bobContact.length > 0) {
                    break;
                } else {
                    await dapiClient.generate(1);
                }
            }

            expect(bobContact).to.have.lengthOf(1);
            // expect(bobContact[0].blockchainUserId).to.be.equal(bobRegTxId);
            expect(bobContact[0]).to.be.deep.equal(
                {
                    act: 0,
                    idx: 0,
                    rev: 0,
                    objtype: 'contact',
                    relation: aliceRegTxId,
                    pver: null,
                    hdextpubkey: bobContactRequest.hdextpubkey,
                },
            );
        });
    });

    describe('Alice', () => {
        it('should be able to approve contact request', async function it() {
            this.timeout(testTimeout);

            const contactAcceptance = Schema.create.dapobject('contact');
            contactAcceptance.hdextpubkey = alicePrivateKey.toPublicKey().toString('hex');
            contactAcceptance.relation = bobRegTxId;

            // 1. Create ST approve contact packet
            const {stpacket: stPacket} = Schema.create.stpacket();
            stPacket.dapobjects = [contactAcceptance];
            stPacket.dapid = dapId;

            // 2. Create State Transition
            const transaction = new Transaction()
                .setType(Transaction.TYPES.TRANSACTION_SUBTX_TRANSITION);

            const serializedPacket = Schema.serialize.encode(stPacket);
            const stPacketHash = doubleSha256(serializedPacket);

            transaction.extraPayload
                .setRegTxId(aliceRegTxId)
                .setHashPrevSubTx(alicePreviousST)
                .setHashSTPacket(stPacketHash)
                .setCreditFee(1000)
                .sign(alicePrivateKey);

            const transitionHash = await dapiClient.sendRawTransition(
                transaction.serialize(),
                serializedPacket.toString('hex'),
            );

            expect(transitionHash).to.be.a('string');
            expect(transitionHash).to.be.not.empty();

            alicePreviousST = transitionHash;

            let aliceContact;
            for (let i = 0; i <= attempts; i++) {
                aliceContact = await dapiClient.fetchDapObjects(dapId, 'contact', {});
                // waiting for Bob's contact to be approved from Alice
                if (aliceContact.length > 1) {
                    break;
                } else {
                    await dapiClient.generate(1);
                }
            }

            expect(aliceContact).to.have.lengthOf(2);
            // expect(aliceContact[0].blockchainUserId).to.be.equal(bobRegTxId);
            // expect(aliceContact[1].blockchainUserId).to.be.equal(aliceRegTxId);
            expect(aliceContact[1]).to.be.deep.equal(
                {
                    act: 1,
                    idx: 0,
                    rev: 0,
                    objtype: 'contact',
                    relation: bobRegTxId,
                    pver: null,
                    hdextpubkey: contactAcceptance.hdextpubkey,
                },
            );
        });

        it('should be able to remove contact approvement', async function it() {
            this.timeout(testTimeout);

            const contactDeleteRequest = Schema.create.dapobject('contact');
            contactDeleteRequest.hdextpubkey = alicePrivateKey.toPublicKey().toString('hex');
            contactDeleteRequest.relation = bobRegTxId;
            contactDeleteRequest.act = 2;

            // 1. Create ST contact delete packet
            const {stpacket: stPacket} = Schema.create.stpacket();
            stPacket.dapobjects = [contactDeleteRequest];
            stPacket.dapid = dapId;

            // 2. Create State Transition
            const transaction = new Transaction()
                .setType(Transaction.TYPES.TRANSACTION_SUBTX_TRANSITION);

            const serializedPacket = Schema.serialize.encode(stPacket);
            const stPacketHash = doubleSha256(serializedPacket);

            transaction.extraPayload
                .setRegTxId(aliceRegTxId)
                .setHashPrevSubTx(alicePreviousST)
                .setHashSTPacket(stPacketHash)
                .setCreditFee(1000)
                .sign(alicePrivateKey);

            const transitionHash = await dapiClient.sendRawTransition(
                transaction.serialize(),
                serializedPacket.toString('hex'),
            );

            expect(transitionHash).to.be.a('string');
            expect(transitionHash).to.be.not.empty();

            alicePreviousST = transitionHash;

            let aliceContact;
            for (let i = 0; i <= attempts; i++) {
                // waiting for Bob's contact to be deleted from Alice
                aliceContact = await dapiClient.fetchDapObjects(dapId, 'contact', {});
                if (aliceContact.length === 1) {
                    break;
                } else {
                    await dapiClient.generate(1);
                }
            }

            expect(aliceContact).to.have.lengthOf(1);
            // expect(aliceContact[0].blockchainUserId).to.be.equal(bobRegTxId);
            expect(aliceContact[0]).to.be.deep.equal(
                {
                    act: 0,
                    idx: 0,
                    rev: 0,
                    objtype: 'contact',
                    relation: aliceRegTxId,
                    pver: null,
                    hdextpubkey: bobPrivateKey.toPublicKey().toString('hex'),
                },
            );
        });
    });

});
