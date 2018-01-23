const { DAPI: api } = require('../../src');
const { expect } = require('chai');
const sinon = require('sinon');
const DAPIClient = require('../../src/api/DAPIClient');

sinon.stub(DAPIClient, 'request').callsFake(function(method, params) {
  if (method === 'getUTXO') {
    if (typeof params[0] === 'string') {
      return [{}];
    }
  }
});

describe('api', () => {
  describe('.address.getUTXO', () => {
    it('Should return list with unspent outputs for correct address, if there are any', async () => {
      const address = '123';
      const utxo = await api.address.getUTXO(address);
      expect(utxo).to.be.an('array');
      const output = utxo[0];
      expect(output).to.be.an('object');
    });
    it('Should return empty list if there is no unspent output', async () => {

    });
    it('Should throw error if something went wrong', async () => {

    });
  });
  describe('.address.getBalance', () => {
    it('', async () => {

    });
  });
  describe('.user.getUser', () => {
    it('', async () => {

    });
  });
  describe('.transaction.sendRaw', () => {
    it('', async () => {

    });
  });
  describe('.transition.sendRaw', () => {
    it('', async () => {

    });
  });
  describe('.block.getBestBlockHeight', () => {
    it('', async () => {

    });
  });
  describe('.block.getBlockHash', () => {
    it('', async () => {

    });
  });
});