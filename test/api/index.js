const { DAPI: api } = require('../../src');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const rpcClient = require('../../src/utils/rpcClient');
const { Address } = require('bitcore-lib-dash');
const dashSchema = require('@dashevo/dash-schema');

chai.use(chaiAsPromised);
const { expect } = chai;

const validAddressWithOutputs = 'yXdxAYfK8eJgQmHpUzMaKEBhqwKQWKSezS';
const validAddressBalance = 1.01;
const validAddressWithoutOutputs = 'yVWnW3MY3QHNXgptKg1iQuCkqmtFhMGyPF';
const invalidAddress = '123';

const validUsername = 'Alice';
const notExistingUsername = 'Bob';
const inalidUsername = '1.2';
const validRegTxId = '';

const validBlockHeight = 2357;
const validBlockHash = '6ce21c33e86c23dac892dab7be45ed791157d9463fbbb1bb45c9fe55a29d8bf8';

const transitionHash = '';
const transactionHash = '';

describe('api', () => {

  before(() => {
    // stub requests to DAPI
    sinon.stub(rpcClient, 'request').callsFake(async function(url, method, params) {
      if (method === 'getUTXO') {
        if (!Address.isValid(params[0])) {
          throw new Error('Address is not valid');
        }
        if (params[0] === validAddressWithOutputs) {
          return [{}];
        }
        if (params[0] === validAddressWithoutOutputs) {
          return [];
        }
        throw new Error('Address not found');
      }
      if (method === 'getBalance') {
        if (!Address.isValid(params[0])) {
          throw new Error('Address is not valid');
        }
        if (params[0] === validAddressWithOutputs) {
          return validAddressBalance;
        }
        if (params[0] === validAddressWithoutOutputs) {
          return 0;
        }
        throw new Error('Address not found');
      }
      if (method === 'getUser') {
        const isValidUsername = dashSchema.Consensus.User.validateUsername(params[0]);
        const validRegTxId = false;
        if (isValidUsername) {
          if (params[0] === validUsername) {
            return {}; //todo
          }
          throw new Error('User with such username not found');
        }
        if (validRegTxId) {

        }
        throw new Error('Not found');
      }
      if (method === 'sendRawTransaction') {
        return transactionHash;
      }
      if (method === 'sendRawTransition') {
        return transitionHash;
      }
      if (method === 'getBestBlockHeight') {
        return 100;
      }
      if (method === 'getBlockHash') {
        if (params[0] === validBlockHeight) {
          return validBlockHash;
        }
        throw new Error('Invalid block height');
      }
      if (method === 'getMNList') {
        return [];
      }
    });
  });

  after(() => {
    // Restore stubbed DAPI request
    rpcClient.request.restore();
  });

  describe('.address.getUTXO', () => {
    it('Should return list with unspent outputs for correct address, if there are any', async () => {
      const utxo = await api.address.getUTXO(validAddressWithOutputs);
      expect(utxo).to.be.an('array');
      const output = utxo[0];
      expect(output).to.be.an('object');
    });
    it('Should return empty list if there is no unspent output', async () => {
      const utxo = await api.address.getUTXO(validAddressWithoutOutputs);
      expect(utxo).to.be.an('array');
      expect(utxo.length).to.be.equal(0);
    });
    it('Should throw error if address is invalid', async () => {
      return expect(api.address.getUTXO(invalidAddress)).to.be.rejected;
    });
    it('Should throw error if address not existing', async () => {
      return expect(api.address.getUTXO(invalidAddress)).to.be.rejected;
    });
  });
  describe('.address.getBalance', () => {
    it('Should return sum of unspent outputs for address', async () => {
      const balance = await api.address.getBalance(validAddressWithOutputs);
      expect(balance).to.be.equal(validAddressBalance);
    });
    it('Should return 0 if there is no unspent outputs', async () => {
      const balance = await api.address.getBalance(validAddressWithoutOutputs);
      expect(balance).to.be.equal(0);
    });
    it('Should throw error if address is invalid', async () => {
      return expect(api.address.getBalance(invalidAddress)).to.be.rejected;
    });
  });
  describe('.user.getUser', () => {
    it('Should throw error if username or regtx is incorrect', async () => {
      return expect(api.user.getUser(inalidUsername)).to.be.rejected;
    });
    it('Should throw error if user not found', async () => {
      return expect(api.user.getUser(notExistingUsername)).to.be.rejected;
    });
    it('Should return user data if user exists', async () => {
      const user = await api.user.getUser(validUsername);
      expect(user).to.be.an('object');
    });
  });
  describe('.transaction.sendRaw', () => {
    it('', async () => {

    });
    it('', async () => {

    });
    it('', async () => {

    });
  });
  describe('.transition.sendRaw', () => {
    it('', async () => {

    });
    it('', async () => {

    });
    it('', async () => {

    });
  });
  describe('.block.getBestBlockHeight', () => {
    it('Should return block height', async () => {
      const bestBlockHeight = await api.block.getBestBlockHeight();
      expect(bestBlockHeight).to.be.a('number');
    });
  });
  describe('.block.getBlockHash', () => {
    it('Should return hash for a given block height', async () => {
      const blockHash = await api.block.getBlockHash(2357);
      expect(blockHash).to.be.a('string');
    });
    it('Should be rejected if height is invalid', async () => {
      await expect(api.block.getBlockHash(1000000)).to.be.rejected;
      await expect(api.block.getBlockHash('some string')).to.be.rejected;
    });
  });
});