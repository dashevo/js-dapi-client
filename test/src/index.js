const Api = require('../../src/index');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const rpcClient = require('../../src/RPCClient');

chai.use(chaiAsPromised);
const { expect } = chai;

const validAddressWithOutputs = 'yXdxAYfK8eJgQmHpUzMaKEBhqwKQWKSezS';
const validAddressBalance = 1.01;
const validAddressWithoutOutputs = 'yVWnW3MY3QHNXgptKg1iQuCkqmtFhMGyPF';
const invalidAddress = '123';

const validUsername = 'Alice';
const notExistingUsername = 'Bob';
const invalidUsername = '1.2';

const validBlockHeight = 2357;
const validBlockHash = '6ce21c33e86c23dac892dab7be45ed791157d9463fbbb1bb45c9fe55a29d8bf8';
const validBaseBlockHash = '000004543e350b99f43114fe0bf649344a28f4fde6785d80e487d90689ae3918'

const validStateTransitionHex = '00000100018096980000000000fece053ccfee6b0e96083af22882ab3a5d420eb033c6adce5f9d70cca7258d3e0000000000000000000000000000000000000000000000000000000000000000fece053ccfee6b0e96083af22882ab3a5d420eb033c6adce5f9d70cca7258d3e0000';
const stateTransitionHash = 'f3bbe9211ac90a7079b9894b8abb49838c082c1bb5565fb87fb6001087794665';
const invalidStateTransitionHex = 'invalidtransitionhex';
const dataPacket = {};

const validTransactionHex = 'ffffffff0000ffffffff';
const transactionHash = 'a8502e9c08b3c851201a71d25bf29fd38a664baedb777318b12d19242f0e46ab';
const invalidTransactionHex = 'invalidtransactionhex';

const validBlockHeader =
{
  "hash": "000008ca1832a4baf228eb1553c03d3a2c8e02399550dd6ea8d65cec3ef23d2e",
  "confirmations": 6213,
  "height": 0,
  "version": 1,
  "versionHex": "00000001",
  "merkleroot": "e0028eb9648db56b1ac77cf090b99048a8007e2bb64b68f092c03c7f56a662c7",
  "time": 1417713337,
  "mediantime": 1417713337,
  "nonce": 1096447,
  "bits": "207fffff",
  "difficulty": 4.656542373906925e-10,
  "chainwork": "0000000000000000000000000000000000000000000000000000000000000002",
  "nextblockhash": "3f4a8012763b1d9b985cc77b0c0bca918830b1ef7dd083665bdc592c2cd31cf6"
}

const validMnListDiff =
{
  baseBlockHash: validBaseBlockHash,
  blockHash: validBlockHash,
  deletedMNs: [],
  mnList: [
    {
      proRegTxHash: 'f7737beb39779971e9bc59632243e13fc5fc9ada93b69bf48c2d4c463296cd5a',
      service: '207.154.244.13:19999',
      keyIDOperator: '43ce12751c4ba45dcdfe2c16cefd61461e17a54d',
      keyIDVoting: '43ce12751c4ba45dcdfe2c16cefd61461e17a54d',
      isValid: true,
    },
    {
      proRegTxHash: '85c11a56c7ebc5d0b6abf32d6e60870516595a861a73e96d771c04edd26423ab',
      service: '207.154.249.154:19999',
      keyIDOperator: 'e0f05fac2f981f182aab2df9c8dbc8e06dc038b8',
      keyIDVoting: 'e0f05fac2f981f182aab2df9c8dbc8e06dc038b8',
      isValid: true,
    },
    {
      proRegTxHash: '75aa128db4cd7679fd88206bd6ef71f57e1b6fe04c2da5515193a6fcd40a47eb',
      service: '159.89.110.184:19999',
      keyIDOperator: '03d90b1cdc04f1dbe435a4ba51ca2d1ddb53e08c',
      keyIDVoting: '03d90b1cdc04f1dbe435a4ba51ca2d1ddb53e08c',
      isValid: true,
    },
  ],
  merkleRootMNList: 'adbb061b19bdcd582b50fae5a29c857e34058d23db79e6defdc8a3498cc2969a',
}

const validBlockchainUserObject = {
  uname: validUsername,
  regtxid: 'e1abfdbda9e0204573f03c8c354c40649c711253ec3c978011ef320bd5bbc33a',
  pubkeyid: 'd7d295e04202cc652d845cc51762dc64a5fd2bdc',
  credits: 10000,
  data: '0000000000000000000000000000000000000000000000000000000000000000',
  state: 'open',
  subtx:
    ['e1abfdbda9e0204573f03c8c354c40649c711253ec3c978011ef320bd5bbc33a'],
  transitions: [],
  from_mempool: true
};

function validateUsername(uname) {
  return uname.length >= 3 && uname.length <= 12 && /^[\x00-\x7F]+$/.test('uname');
}

describe('api', () => {

  before(() => {
    // stub requests to DAPI
    sinon.stub(rpcClient, 'request').callsFake(async function (url, method, params) {
      const {
        address, username, userId, rawTransaction, rawTransitionHeader, rawTransitionPacket, height, blockHash, baseBlockHash
      } = params;
      if (method === 'getUTXO') {
        if (address === validAddressWithOutputs) {
          return [{}];
        }
        if (address === validAddressWithoutOutputs) {
          return [];
        }
        throw new Error('Address not found');
      }
      if (method === 'getBalance') {
        if (address === validAddressWithOutputs) {
          return validAddressBalance;
        }
        if (address === validAddressWithoutOutputs) {
          return 0;
        }
        throw new Error('Address not found');
      }
      if (method === 'getUser') {
        /*
        Since dash schema uses fs, it would be impossible to run tests in browser
        with current version of validation from dash-schema
        */
        if (username !== undefined) {
          const isValidUsername = validateUsername(username);
          if (isValidUsername) {
            if (username === validUsername) {
              return validBlockchainUserObject;
            }
          }
          throw new Error('User with such username not found');
        } else {
          if (userId === validBlockchainUserObject.regtxid) {
            return validBlockchainUserObject;
          }
          throw new Error('User with such od not found');
        }
        throw new Error('Not found');
      }
      if (method === 'sendRawTransition') {
        if (!rawTransitionHeader || typeof rawTransitionPacket !== 'object') {
          throw new Error('Data packet is missing');
        }
        const transitionHeader = new TransitionHeader().fromString(rawTransitionHeader);
        return transitionHeader.toObject().tsid;
      }
      if (method === 'getBestBlockHeight') {
        return 100;
      }
      if (method === 'getBlockHash') {
        if (height === validBlockHeight) {
          return validBlockHash;
        }
        throw new Error('Invalid block height');
      }
      if (method === 'getMNList') {
        return [];
      }
      if (method === 'getBlockHeader') {
        if (blockHash === validBlockHash) {
          return validBlockHeader;
        }
        throw new Error('Invalid block hash');
      }
      if (method === 'getMnListDiff') {
        if (baseBlockHash === validBaseBlockHash && blockHash === validBlockHash) {
          return validMnListDiff;
        }
        throw new Error('Invalid baseBlockHash or blockHash');
      }
    });
  });

  after(() => {
    // Restore stubbed DAPI request
    rpcClient.request.restore();
  });

  describe('constructor', () => {
    it('Should set seeds and port, if passed', async () => {
      const dapi = new Api({ seeds: [{ ip: '127.1.2.3' }], port: 1234 });
      expect(dapi.DAPIPort).to.be.equal(1234);
      expect(dapi.MNDiscovery.masternodeListProvider.DAPIPort).to.be.equal(1234);
      expect(dapi.MNDiscovery.masternodeListProvider.masternodeList).to.be.deep.equal([{ ip: '127.1.2.3' }]);
      expect(dapi.MNDiscovery.seeds).to.be.deep.equal([{ ip: '127.1.2.3' }]);

      await dapi.getBestBlockHeight();
      expect(rpcClient.request.calledWith({ host: '127.1.2.3', port: 1234 }, 'getMNList', {})).to.be.true;
      expect(rpcClient.request.calledWith({ host: '127.1.2.3', port: 1234 }, 'getBestBlockHeight', {})).to.be.true;
    });
  });

  describe('.address.getUTXO', () => {
    it('Should return list with unspent outputs for correct address, if there are any', async () => {
      const dapi = new Api();
      const utxo = await dapi.getUTXO(validAddressWithOutputs);
      expect(utxo).to.be.an('array');
      const output = utxo[0];
      expect(output).to.be.an('object');
    });
    it('Should return empty list if there is no unspent output', async () => {
      const dapi = new Api();
      const utxo = await dapi.getUTXO(validAddressWithoutOutputs);
      expect(utxo).to.be.an('array');
      expect(utxo.length).to.be.equal(0);
    });
    it('Should throw error if address is invalid', async () => {
      const dapi = new Api();
      return expect(dapi.getUTXO(invalidAddress)).to.be.rejected;
    });
    it('Should throw error if address not existing', async () => {
      const dapi = new Api();
      return expect(dapi.getUTXO(invalidAddress)).to.be.rejected;
    });
  });
  describe('.address.getBalance', () => {
    it('Should return sum of unspent outputs for address', async () => {
      const dapi = new Api();
      const balance = await dapi.getBalance(validAddressWithOutputs);
      expect(balance).to.be.equal(validAddressBalance);
    });
    it('Should return 0 if there is no unspent outputs', async () => {
      const dapi = new Api();
      const balance = await dapi.getBalance(validAddressWithoutOutputs);
      expect(balance).to.be.equal(0);
    });
    it('Should throw error if address is invalid', async () => {
      const dapi = new Api();
      return expect(dapi.getBalance(invalidAddress)).to.be.rejected;
    });
  });
  describe('.user.getUserByName', () => {
    it('Should throw error if username or regtx is incorrect', async () => {
      const dapi = new Api();
      return expect(dapi.getUserByName(invalidUsername)).to.be.rejected;
    });
    it('Should throw error if user not found', async () => {
      const dapi = new Api();
      return expect(dapi.getUserByName(notExistingUsername)).to.be.rejected;
    });
    it('Should return user data if user exists', async () => {
      const dapi = new Api();
      const user = await dapi.getUserByName(validUsername);
      expect(user).to.be.an('object');
    });
  });
  describe('.user.getUserById', () => {
    it('Should throw error if use id is incorrect', async () => {
      const dapi = new Api();
      const user = await dapi.getUserByName(validUsername);
      dapi.generate(10);
      return expect(dapi.getUserById(user.regtxid + "fake")).to.be.rejected;
    });
    it('Should throw error if user id not found', async () => {
      const dapi = new Api();
      return expect(dapi.getUserById(notExistingUsername)).to.be.rejected;
    });
    it('Should return user data if user exists', async () => {
      const dapi = new Api();
      const user = await dapi.getUserByName(validUsername);
      const userById = await dapi.getUserById(user.regtxid)
      expect(userById).to.be.an('object');
    });
  });
  describe('.block.getBestBlockHeight', () => {
    it('Should return block height', async () => {
      const dapi = new Api();
      const bestBlockHeight = await dapi.getBestBlockHeight();
      expect(bestBlockHeight).to.be.a('number');
      expect(bestBlockHeight).to.be.equal(100);
    });
  });
  describe('.block.getBlockHash', () => {
    it('Should return hash for a given block height', async () => {
      const dapi = new Api();
      const blockHash = await dapi.getBlockHash(2357);
      expect(blockHash).to.be.a('string');
      expect(blockHash).to.be.equal(validBlockHash);
    });
    it('Should be rejected if height is invalid', async () => {
      const dapi = new Api();
      await expect(dapi.getBlockHash(1000000)).to.be.rejected;
      await expect(dapi.getBlockHash('some string')).to.be.rejected;
      await expect(dapi.getBlockHash(1.2)).to.be.rejected;
      await expect(dapi.getBlockHash(-1)).to.be.rejected;
      await expect(dapi.getBlockHash(true)).to.be.rejected;
    });
  });

  describe('.block.getBlockHeader', () => {
    it('Should return block header by hash', async () => {
      const dapi = new Api();
      const blockHeader = await dapi.getBlockHeader(validBlockHash);
      expect(blockHeader.height).to.exist;
      expect(blockHeader.bits).to.exist;
      expect(blockHeader.chainwork).to.exist;
      expect(blockHeader.confirmations).to.exist;
      expect(blockHeader.difficulty).to.exist;
      expect(blockHeader.hash).to.exist;
      expect(blockHeader.mediantime).to.exist;
      expect(blockHeader.merkleroot).to.exist;
      expect(blockHeader.nextblockhash).to.exist;
      expect(blockHeader.nonce).to.exist;
      expect(blockHeader.time).to.exist;
      expect(blockHeader.version).to.exist;
    });
  });

  describe('.mnlist.getMnListDiff', () => {
    it('Should return mnlistdiff', async () => {
      const dapi = new Api();
      const mnlistdiff = await dapi.getMnListDiff(validBaseBlockHash, validBlockHash);
      expect(mnlistdiff.baseBlockHash).to.be.equal(validBaseBlockHash);
      expect(mnlistdiff.blockHash).to.be.equal(validBlockHash);
      expect(mnlistdiff.deletedMNs).to.be.an('array');
      expect(mnlistdiff.mnList).to.be.an('array');
    });
  });
});