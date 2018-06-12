const {spawn} = require('child_process');
const {TransitionPacket, TransitionHeader} = require('@dashevo/dashcore-lib').StateTransition;
const Schema = require('@dashevo/dash-schema');

const Api = require('../../src/api');

const BitcoreLib = require('@dashevo/dashcore-lib');
const {PrivateKey, PublicKey, Address} = BitcoreLib;
const {Registration, TopUp} = BitcoreLib.Transaction.SubscriptionTransactions;

const api = new Api({ port: 3000 });

const timeout = ms => new Promise(res => setTimeout(res, ms))

async function execCommand(command, params, options, waitString) {
    return new Promise(resolve => {
        let result = '';
        const sp = spawn(command, params, options);

        sp.stdout.on('data', data => {
            // console.log(`stdout: ${data}`);
            result += data;
            if (waitString != undefined && data.indexOf(waitString) > 1) {
                console.log(`found stdout: ${data}`);
                sp.stdin.end();
                sp.stdout.destroy();
                sp.stderr.destroy();
            }
        });

        sp.stderr.on('data', data => {
            console.log(`stderr: ${data}`);
            result += data;
        });

        sp.on('close', code => {
            console.log(command, params, options, `command, params, options, child process exited with code ${code}`);
            resolve(result)
        });
    });
}

/**
 * Register user
 * @param {string} username
 * @param {string} privateKeyString
 * @returns {Promise<string>}
 */
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

async function registerDap(dapSchema, privateKeyString, userId) {
    const privateKey = new PrivateKey(privateKeyString);

    const dapContract = Schema.create.dapcontract(dapSchema);

    // create a packet
    const tsp = Schema.create.tspacket();
    tsp.tspacket.dapcontract = dapContract.dapcontract;
    tsp.tspacket.dapid = dapContract.dapcontract.meta.dapid;
    Schema.object.setID(tsp);

    const validTsp = Schema.object.validate(tsp);
    if (!validTsp.valid) {
        throw new Error('Packet is not valid.');
    }

    const transitionPacket = new TransitionPacket()
        .addObject(tsp);

    const transitionHeader = new TransitionHeader()
        .setMerkleRoot(transitionPacket.getMerkleRoot().toString('hex'))
        .setRegTxHash(userId)
        .sign(privateKey)
        .serialize();

    return api.sendRawTransition(
        transitionHeader,
        transitionPacket.serialize().toString('hex'),
    );
}

async function updateUserState(dapId, userId, objects, privateKeyString) {
    const privateKey = new PrivateKey(privateKeyString);

    const dashPayContract = await api.getDapContract(dapId);

    const user = await api.getUserById(userId);

    // create a packet
    const tsp = Schema.create.tspacket();
    tsp.tspacket.dapobjects = objects;
    tsp.tspacket.dapobjmerkleroot = '';
    tsp.tspacket.dapid = dapId;
    Schema.object.setID(tsp, dashPayContract.dapcontract.dapschema);

    const packetValidationState = Schema.object.validate(tsp);
    if (!packetValidationState.valid) {
        throw new Error(`Packet is not valid: ${packetValidationState.validateErrors[0].message}`);
    }

    const transitionPacket = new TransitionPacket()
        .addObject(tsp);

    const transitionHeader = new TransitionHeader()
        .setMerkleRoot(transitionPacket.getMerkleRoot().toString('hex'))
        .setRegTxHash(userId);

    if (user.transitions.length > 0) {
        transitionHeader.setPrevTransitionHash(user.transitions[user.transitions.length - 1]);
    }

    return api.sendRawTransition(
        transitionHeader.sign(privateKey).serialize(),
        transitionPacket.serialize().toString('hex'),
    );
}

/**
 * Tops up user credits. Note that anyone can top up user credits.
 * @param {string} regTxId
 * @param {string} privateKeyString
 * @returns {Promise<string>}
 */
async function topUpUserCredits(regTxId, privateKeyString) {
    const privateKey = new PrivateKey(privateKeyString);
    const publicKey = PublicKey.fromPrivateKey(privateKey);
    // Change to livenet, if you want to create address for livenet
    // You need to topup this address first
    const address = Address
        .fromPublicKey(publicKey, 'testnet')
        .toString();

    const inputs = await api.getUTXO(address);
    const fundingInDuffs = 1000 * 1000; // 0.01 Dash
    const subTx = new TopUp();
    subTx.fund(regTxId, fundingInDuffs, inputs, address).sign(privateKey);

    return api.sendRawTransaction(subTx.serialize());
}

module.exports = {
    execCommand,
    registerUser,
    updateUserState,
    registerDap,
    topUpUserCredits,
    timeout
};
