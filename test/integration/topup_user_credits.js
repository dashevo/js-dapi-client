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

const constants = {
    StateTransition: {
        VERSION: 1,
        PACKET_OBJECT_TYPE: 'TransitionPacket',
        NULL_HASH: new buffer.Buffer('0000000000000000000000000000000000000000000000000000000000000000', 'hex')
    },
    PUB_KEY_ID_LENGTH: 20,
    EVO_VERSION: 0x00010000,
    SUBSCRIPTION_TRANSACTION_TYPES: {
        REGISTER: 1,
        TOP_UP: 2
    }
};

config.Api.port = 3000;

const testPrivateKey = new PrivateKey();
const txIdCommon = '74bae538b381ea952868c0c0dd87806f45492189e6aaabf68c6922c3c7efc074';
const scriptCommon = 'OP_DUP OP_HASH160 20 0x88d9931ea73d60eaf7e5671efc0552b912911f2a OP_EQUALVERIFY OP_CHECKSIG';

let api;
let testAddress;
let address;
let topUpTx;
let UTXO;


describe('async.registerUser', async () => {
    before(async () => {
        // Need to start mn-bootstrap
        api = new Api();

        let privateKey = new PrivateKey(privateKeyString);
        let publicKey = PublicKey.fromPrivateKey(privateKey);
        address = Address.fromPublicKey(publicKey, 'testnet').toString();
    });

    beforeEach(async () => {
        topUpTx = new TopUp();

        UTXO = await api.getUTXO(address);
        testAddress = testPrivateKey.toPublicKey().toAddress();
    });

    after(async () => {
    });

    it('Every fund should increase number of inputs/outputs', async () => {
        let regTxId = 'a477af6b2667c29670467e4e0728b685ee07b240235771862318e29ddbe58458';
        let nums = [1, 2, 3, 4];
        nums.forEach(function (num) {
            let topUpSubtx = topUpTx
                .fund(regTxId, 10000, UTXO, testAddress);
            expect(topUpSubtx).to.be.an('object');
            expect(topUpSubtx.inputs).to.have.lengthOf(num);
            expect(topUpSubtx.nLockTime).to.equal(0);
            expect(topUpSubtx.outputs).to.have.lengthOf(1 + num);
            expect(topUpSubtx.version).to.equal(1);
        });
    });

    it('List of inputs/outputs arrays are increased with new funding without signing', async () => {
        let testFundingAmount = 10000;
        let regTxId = 'a477af6b2667c29670467e4e0728b685ee07b240235771862318e29ddbe58458';

        let topUpSubtx = await topUpTx
            .fund(regTxId, testFundingAmount, UTXO, testAddress);
        expect(topUpSubtx).to.be.an('object');
        expect(topUpSubtx.inputs).to.have.lengthOf(1);
        expect(topUpSubtx.nLockTime).to.equal(0);
        expect(topUpSubtx.outputs).to.have.lengthOf(2);
        expect(topUpSubtx.version).to.equal(1);

        await topUpTx
            .fund(regTxId, testFundingAmount * 5, UTXO, testAddress);
        // check that list of inputs/outputs for topUpSubtx was increased for topUpSubtx
        expect(topUpSubtx).to.be.an('object');
        expect(topUpSubtx.inputs).to.have.lengthOf(2);
        expect(topUpSubtx.nLockTime).to.equal(0);
        expect(topUpSubtx.outputs).to.have.lengthOf(3);
        expect(topUpSubtx.version).to.equal(1);
    });

    it('List of inputs/outputs arrays are increased with new funding with signing & fee', async () => {
        let testFundingAmount = 10000;
        let regTxId = 'a477af6b2667c29670467e4e0728b685ee07b240235771862318e29ddbe58458';

        let topUpSubtx = await topUpTx
            .fund(regTxId, testFundingAmount, UTXO, testAddress);
        expect(topUpSubtx).to.be.an('object');
        expect(topUpSubtx.inputs).to.have.lengthOf(1);
        expect(topUpSubtx.nLockTime).to.equal(0);
        expect(topUpSubtx.outputs).to.have.lengthOf(2);
        expect(topUpSubtx.version).to.equal(1);

        topUpSubtx.sign(testPrivateKey).fee(1000);

        await topUpTx
            .fund(regTxId, testFundingAmount * 5, UTXO, testAddress);
        // check that list of inputs/outputs for topUpSubtx was increased for topUpSubtx
        expect(topUpSubtx).to.be.an('object');
        expect(topUpSubtx.inputs).to.have.lengthOf(2);
        expect(topUpSubtx.nLockTime).to.equal(0);
        expect(topUpSubtx.outputs).to.have.lengthOf(3);
        expect(topUpSubtx.version).to.equal(1);
    });

    it('only last fee should be applied for topUpSubtx', async () => {
        let testFundingAmount = 10000;

        let regTxId = 'a477af6b2667c29670467e4e0728b685ee07b240235771862318e29ddbe58458';
        let topUpSubtx = await topUpTx.fund(regTxId, testFundingAmount, UTXO, testAddress);
        expect(topUpSubtx).to.be.an('object');
        expect(topUpSubtx.inputs).to.have.lengthOf(1);
        let in11 = topUpSubtx.inputs[0];
        expect(topUpSubtx.nLockTime).to.equal(0);
        expect(topUpSubtx.outputs).to.have.lengthOf(2);
        let out12 = topUpSubtx.outputs[0];
        let out11 = topUpSubtx.outputs[1];
        expect(topUpSubtx.version).to.equal(1);

        let fees = [1, 200000, 3];
        fees.forEach(function (fValue) {
            topUpSubtx.sign().fee(fValue);
        });
        expect(topUpSubtx).to.be.an('object');
        expect(topUpSubtx.inputs).to.have.lengthOf(1);
        let in21 = topUpSubtx.inputs[0];
        expect(topUpSubtx.nLockTime).to.equal(0);
        expect(topUpSubtx.outputs).to.have.lengthOf(2);
        let out22 = topUpSubtx.outputs[0];
        let out21 = topUpSubtx.outputs[1];
        expect(topUpSubtx.version).to.equal(1);

        // take into account fee( only last fee should be applied)
        let feeExpected = fees.slice(-1)[0];
        in11.output._satoshis -= feeExpected;
        expect(in11).to.equal(in21);
        out11._satoshis += testFundingAmount;
        out11._satoshis -= feeExpected;
        out11._satoshisBN.words[0] += testFundingAmount;
        out11._satoshisBN.words[0] -= feeExpected;
        expect(out11).to.deep.equal(out21);
        out12._satoshis -= feeExpected;
        expect(out12).to.equal(out22);
    });


    it('topUpSubtx is not changed after sign without funding', async () => {

        let testFundingAmount = 10000;
        let testFee = 1000;

        let regTxId = 'a477af6b2667c29670467e4e0728b685ee07b240235771862318e29ddbe58458';
        let topUpSubtx = await topUpTx.fund(regTxId, testFundingAmount, UTXO, testAddress);
        expect(topUpSubtx).to.be.an('object');
        expect(topUpSubtx.inputs).to.have.lengthOf(1);
        let in11 = topUpSubtx.inputs[0];
        expect(topUpSubtx.nLockTime).to.equal(0);
        expect(topUpSubtx.outputs).to.have.lengthOf(2);
        let out12 = topUpSubtx.outputs[0];
        let out11 = topUpSubtx.outputs[1];
        expect(topUpSubtx.version).to.equal(1);

        topUpSubtx.sign(testPrivateKey);
        // UTXO should be the same after signing
        expect(topUpSubtx).to.be.an('object');
        expect(topUpSubtx.inputs).to.have.lengthOf(1);
        let in21 = topUpSubtx.inputs[0];
        expect(topUpSubtx.nLockTime).to.equal(0);
        expect(topUpSubtx.outputs).to.have.lengthOf(2);
        let out22 = topUpSubtx.outputs[0];
        let out21 = topUpSubtx.outputs[1];
        expect(topUpSubtx.version).to.equal(1);

        expect(in11).to.equal(in21);
        expect(out11).to.equal(out21);
        expect(out12).to.equal(out22);
    });

    it('topUpSubtx is changed after fee with signing', async () => {
        let testFundingAmount = 10000;
        let testFee = 1000;

        let regTxId = 'a477af6b2667c29670467e4e0728b685ee07b240235771862318e29ddbe58458';
        let topUpSubtx = await topUpTx.fund(regTxId, testFundingAmount, UTXO, testAddress);
        expect(topUpSubtx).to.be.an('object');
        expect(topUpSubtx.inputs).to.have.lengthOf(1);
        let in11 = topUpSubtx.inputs[0];
        expect(topUpSubtx.nLockTime).to.equal(0);
        expect(topUpSubtx.outputs).to.have.lengthOf(2);
        let out12 = topUpSubtx.outputs[0];
        let out11 = topUpSubtx.outputs[1];
        expect(topUpSubtx.version).to.equal(1);

        topUpSubtx.fee(testFee);
        expect(topUpSubtx).to.be.an('object');
        expect(topUpSubtx.inputs).to.have.lengthOf(1);
        let in21 = topUpSubtx.inputs[0];
        expect(topUpSubtx.nLockTime).to.equal(0);
        expect(topUpSubtx.outputs).to.have.lengthOf(2);
        let out22 = topUpSubtx.outputs[0];
        let out21 = topUpSubtx.outputs[1];
        expect(topUpSubtx.version).to.equal(1);

        // take into account fee and funding amount and the compare UTXO
        in11.output._satoshis -= testFee;
        expect(in11).to.equal(in21);
        out11._satoshis += testFundingAmount;
        out11._satoshis -= testFee
        out11._satoshisBN.words[0] += testFundingAmount;
        out11._satoshisBN.words[0] -= testFee;
        expect(out11).to.deep.equal(out21);
        out12._satoshis -= testFee;
        expect(out12).to.equal(out22);
    });

    it('only regTxId is changed in multiple topUpSubtxs', async () => {

        let testFundingAmount = 10000;
        let testFee = 1000;

        let regTxId = 'a477af6b2667c29670467e4e0728b685ee07b240235771862318e29ddbe58458';

        let topUpSubtx = await topUpTx
            .fund(regTxId, testFundingAmount, UTXO, testAddress);

        let topUpData = topUpTx.getTopUpData();

        topUpSubtx.sign(testPrivateKey).fee(testFee).fund(regTxId, testFundingAmount, UTXO, testAddress).sign().fee(testFee * 2 - 123).sign().fund(regTxId, testFundingAmount * 5 + 2, UTXO, testAddress).fund(regTxId, testFundingAmount - 99, UTXO, testAddress).fee(0).fund(regTxId, 0, UTXO, testAddress).fee(1231).sign();

        let topUpData2 = topUpTx.getTopUpData();
        expect(topUpData.regTxId).to.equal(regTxId);
        expect(topUpData.funding).to.equal(testFundingAmount);
        expect(topUpData.subTxType).to.equal(constants.SUBSCRIPTION_TRANSACTION_TYPES.TOP_UP);
        expect(topUpData.version).to.equal(65536);
        // only regTxId is changed
        topUpData.regTxId = topUpData2.regTxId;
        expect(topUpData).to.deep.equal(topUpData2);
    });

    // TODO post tickets!!! some strings ignored/obfuscated
    let regTxIdsForCase = ['a477af6b2667c29670467e4e0728b685ee07b240235771862318e29ddbe58458', '', 'fake', "a".repeat(100000), '3333', 'keke', 'hex', 'int', 'string'];
    regTxIdsForCase.forEach(function (rTxId) {
        it('Should allow regSubTxId with string values', async () => {
            let testFundingAmount = 10000;
            let topUpSubtx = topUpTx.fund(rTxId, testFundingAmount, UTXO, testAddress);

            let topUpData = topUpSubtx.sign(testPrivateKey)
                .fee(1000).getTopUpData();
            expect(topUpData.regTxId).to.equal(rTxId);
            expect(topUpData.funding).to.equal(testFundingAmount);
            expect(topUpData.subTxType).to.equal(constants.SUBSCRIPTION_TRANSACTION_TYPES.TOP_UP);
        });
    });

    it('Should throw error when regTxId is number', async () => {
        let regTxId = 1000;
        return expect(() => {
            topUpTx.fund(regTxId, 10000, UTXO, testAddress)
        }).to.throw(TypeError, 'The "value" argument must not be of type number. Received type number');
    });

    it('Should throw error when regTxId is undefined', async () => {
        let regTxId = undefined;
        return expect(() => {
            topUpTx.fund(regTxId, 10000, UTXO, testAddress)
        }).to.throw(TypeError, 'The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type undefined');
    });

// TODO post tickets!!! some strings ignored/obfuscated ???
    let regTxIds = [[1, 2, 3], ['abcde'], Buffer.from('abc'), new Int32Array(new ArrayBuffer(8))];
    regTxIds.forEach(function (rTxId) {
        it('Should allow regSubTxId to be Buffer, ArrayBuffer, Array, or Array-like Object', async () => {
            let testFundingAmount = 10000;
            let topUpSubtx = topUpTx.fund(rTxId, testFundingAmount, UTXO, testAddress);

            let topUpData = topUpSubtx.sign(testPrivateKey)
                .fee(1000).getTopUpData();
            expect(topUpData.regTxId).to.equal(rTxId);
            expect(topUpData.funding).to.equal(testFundingAmount);
            expect(topUpData.subTxType).to.equal(constants.SUBSCRIPTION_TRANSACTION_TYPES.TOP_UP);
        });
    });

    it('Should throw error when funding is undefined', async () => {
        let funding = undefined;
        return expect(() => {
            topUpTx.fund('regTxId', funding, UTXO, testAddress)
        }).to.throw('Invalid Argument: Output satoshis is not a natural number');
    });

    it('Should throw error when funding is string', async () => {
        let funding = 'str';
        return expect(() => {
            topUpTx.fund('regTxId', funding, UTXO, testAddress)
        }).to.throw('Invalid state: Output satoshis is not a natural number');
    });

    it('Should throw error when funding is negative', async () => {
        let funding = -10;
        return expect(() => {
            topUpTx.fund('regTxId', funding, UTXO, testAddress)
        }).to.throw('Invalid Argument: Output satoshis is not a natural number');
    });

    it('Should throw error when finfing is float', async () => {
        let funding = 10.4;
        return expect(() => {
            topUpTx.fund('regTxId', funding, UTXO, testAddress)
        }).to.throw('Invalid Argument: Output satoshis is not a natural number');
    });

    let fundings = [0, 9999999900];
    fundings.forEach(function (funding) {
        it('Should allow to set any natural number for funding ', async () => {
            let topUpSubtx = topUpTx.fund('rTxId', funding, UTXO, testAddress);
            let topUpData = topUpSubtx.sign(testPrivateKey)
                .fee(1000).getTopUpData();
            expect(topUpData.funding).to.equal(funding);
        });
    });

    it('Should fund with minimum UTXO fields', async () => {
        let regTxId = 'a477af6b2667c29670467e4e0728b685ee07b240235771862318e29ddbe58458';
        let testFundingAmount = 10000;
        let testUTXO = {
            'txId': txIdCommon,
            'outputIndex': 0,
            'script': scriptCommon,
            'satoshis': 123000
        };
        let topUpSubtx = await topUpTx
            .fund(regTxId, testFundingAmount, testUTXO, testAddress);
        expect(topUpSubtx).to.be.an('object');
        expect(topUpSubtx.inputs).to.have.lengthOf(1);
        expect(topUpSubtx.nLockTime).to.equal(0);
        expect(topUpSubtx.outputs).to.have.lengthOf(2);
        expect(topUpSubtx.version).to.equal(1);
    });

    it('txId is required property in UTXO/inputs parameter for funding', async () => {
        let testUTXO = {
            // 'txId': txIdCommon,
            'outputIndex': 0,
            'script': scriptCommon,
            'satoshis': 123000
        };
        return expect(() => {
            topUpTx.fund('regTxId', 10000, testUTXO, testAddress)
        }).to.throw('Invalid TXID in object');
    });

    let txIdsInvalid = [0, '', 'ahaha', 100];
    txIdsInvalid.forEach(function (txId) {
        it('Should throw error when inputs.txId is invalid', async () => {
            let testUTXO = {
                'txId': txId,
                'outputIndex': 0,
                'script': scriptCommon,
                'satoshis': 123000
            };
            return expect(() => {
                topUpTx.fund('regTxId', 10000, testUTXO, testAddress)
            }).to.throw('Invalid TXID in object');
        });
    });

    it('outputIndex is required property in inputs parameter for funding', async () => {
        let testUTXO = {
            'txId': txIdCommon,
            // 'outputIndex': 0,
            'script': scriptCommon,
            'satoshis': 123000
        };
        return expect(() => {
            topUpTx.fund('regTxId', 10000, testUTXO, testAddress)
        }).to.throw('Invalid outputIndex, received undefined');
    });

    let outputIndexsInvalid = [0, 1, '', 'ahaha', 100];
    outputIndexsInvalid.forEach(function (outputIndex) {
        it('outputIndex is sssss required property in inputs parameter for funding', async () => {
            let testUTXO = {
                'txId': txIdCommon,
                'outputIndex': '',
                'script': scriptCommon,
                'satoshis': 123000
            };
            return expect(() => {
                topUpTx.fund('regTxId', 10000, testUTXO, testAddress)
            }).to.throw('Invalid outputIndex, received ');
        });
    });

    it('script is required property in inputs parameter for funding', async () => {
        let testUTXO = {
            'txId': txIdCommon,
            'outputIndex': 0,
            // 'script': scriptCommon,
            'satoshis': 123000
        };
        return expect(() => {
            topUpTx.fund('regTxId', 10000, testUTXO, testAddress)
        }).to.throw('Invalid Argument: Must provide the scriptPubKey for that output!');
    });

    let scriptsInvalid = [0, 1, '', 'ahaha', 100];
    scriptsInvalid.forEach(function (script) {
        it('script is required property in inputs parameter for funding', async () => {
            let testUTXO = {
                'txId': txIdCommon,
                'outputIndex': 0,
                'script': '',
                'satoshis': 123000
            };
            return expect(() => {
                topUpTx.fund('regTxId', 10000, testUTXO, testAddress)
            }).to.throw('Abstract Method Invocation: Input#clearSignatures'); // bad error message
        });
    });

    it('satoshis is required property in inputs parameter for funding', async () => {
        let testUTXO = {
            'txId': txIdCommon,
            'outputIndex': 0,
            'script': scriptCommon,
            // 'satoshis': 123000
        };
        return expect(() => {
            topUpTx.fund('regTxId', 10000, testUTXO, testAddress)
        }).to.throw('Invalid Argument: Must provide an amount for the output');
    });

    it('Should throw error when satoshis is negative number', async () => {
        let testUTXO = {
            'txId': txIdCommon,
            'outputIndex': 0,
            'script': scriptCommon,
            'satoshis': -1
        };
        return expect(() => {
            topUpTx.fund('regTxId', 10000, testUTXO, testAddress)
        }).to.throw('Invalid Argument: Output satoshis is not a natural number');
    });

    let satoshisInvalid = ['', 'ahaha'];
    satoshisInvalid.forEach(function (satoshis) {
        it('Should throw error when satoshis is string', async () => {
            let testUTXO = {
                'txId': txIdCommon,
                'outputIndex': 0,
                'script': scriptCommon,
                'satoshis': satoshis
            };
            return expect(() => {
                topUpTx.fund('regTxId', 10000, testUTXO, testAddress)
            }).to.throw('Invalid Argument: Amount must be a number');
        });
    })

    it('Address is required for funding', async () => {
        return expect(() => {
            topUpTx.fund('regTxId', 10000, UTXO)
        }).to.throw('Invalid Argument: address is required');
    });

    it('Should throw error when address is invalid string', async () => {
        return expect(() => {
            topUpTx.fund('regTxId', 10000, UTXO, 'ss')
        }).to.throw('Input string too short');
    });

    it('Should throw error when address is number', async () => {
        return expect(() => {
            topUpTx.fund('regTxId', 10000, UTXO, 12)
        }).to.throw('First argument is an unrecognized data format.');
    });
});


