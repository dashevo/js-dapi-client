const { DAPI: api } = require('../../src');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const rpcClient = require('../../src/utils/rpcClient');
const { Address } = require('bitcore-lib-dash');

chai.use(chaiAsPromised);
const { expect } = chai;

const validAddressWithOutputs = 'yXdxAYfK8eJgQmHpUzMaKEBhqwKQWKSezS';
const validAddressWithoutOutputs = 'yVWnW3MY3QHNXgptKg1iQuCkqmtFhMGyPF';
const invalidAddress = '123';

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
        if (typeof params[0] === 'string') {
          return 1;
        }
      }
      if (method === 'getUser') {
        // First parameter should be string - username or regtxhash
      }
      if (method === 'sendRawTransaction') {
        // Validate HEX
      }
      if (method === 'sendRawTransition') {
        // Validate transition
      }
      if (method === 'getBestBlockHeight') {
        return 100;
      }
      if (method === 'getBlockHash') {
        return 100;
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

    });
    it('Should throw error if address is invalid', async () => {
      const address = '123';
      return expect(api.address.getBalance(address)).to.be.rejected;
    });
  });
  describe('.user.getUser', () => {
    it('Should throw error if username or regtx is incorrect', async () => {

    });
    it('Should throw error if user not found', async () => {

    });
    it('Should return user data if user exists', async () => {

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
    it('', async () => {

    });
    it('', async () => {

    });
    it('', async () => {

    });
  });
  describe('.block.getBlockHash', () => {
    it('', async () => {

    });
    it('', async () => {

    });
    it('', async () => {

    });
  });
});