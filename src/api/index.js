const { DAPIService } = require('../services');

const api = {
  address: {
    getUTXO: async (address) => {
      const response = await DAPIService.request('getUTXO', [address]);
      if (response.error) {
        throw new Error(`DAPI error: ${response.error.message}`);
      }
      return response.result;
    },
    getBalance: async (address) => {
      const response = await DAPIService.request('getBalance', [address]);
      if (response.error) {
        throw new Error(`DAPI error: ${response.error.message}`);
      }
      return response.result;
    },
  },
  user: {
    getData: async (usernameOrRegTxId) => {
      const response = await DAPIService.request('getUser', [usernameOrRegTxId]);
      if (response.error) {
        throw new Error(`DAPI error: ${response.error.message}`);
      }
      return response.result;
    },
  },
  transaction: {
    sendRaw: async (rawTx) => {
      const response = await DAPIService.request('sendRawTransaction', [rawTx]);
      if (response.error) {
        throw new Error(`DAPI error: ${response.error.message}`);
      }
      return response.result;
    },
  },
  transition: {
    async sendRaw(rawTransition, dataPacket) {
      const response = await DAPIService.request('sendRawTransition', [rawTransition, dataPacket]);
      if (response.error) {
        throw new Error(`DAPI error: ${response.error.message}`);
      }
      return response.result;
    },
  },
  block: {
    async getBestBlockHeight() {
      const response = await DAPIService.request('getBestBlockHeight');
      if (response.error) {
        throw new Error(`DAPI error: ${response.error.message}`);
      }
      return response.result;
    },
    async getBlockHash(blockHeight) {
      const response = await DAPIService.request('getBlockHash', [blockHeight]);
      if (response.error) {
        throw new Error(`DAPI error: ${response.error.message}`);
      }
      return response.result;
    },
  },
};

module.exports = api;
