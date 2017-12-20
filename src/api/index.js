const jayson = require('jayson/promise');

// Local dapi instance. For testing purposes only
const dapi = jayson.client.http({ port: 4019 });

const api = {
  address: {
    getUTXO: async (address) => {
      const response = await dapi.request('getUTXO', [address]);
      if (response.error) {
        throw new Error(`DAPI error: ${response.error.message}`);
      }
      return response.result;
    },
    getBalance: async (address) => {
      const response = await dapi.request('getBalance', [address]);
      if (response.error) {
        throw new Error(`DAPI error: ${response.error.message}`);
      }
      return response.result;
    },
  },
  user: {
    getData: async (usernameOrRegTxId) => {
      const response = await dapi.request('getUser', [usernameOrRegTxId]);
      if (response.error) {
        throw new Error(`DAPI error: ${response.error.message}`);
      }
      return response.result;
    },
  },
  transaction: {
    sendRaw: async (rawTx) => {
      const response = await dapi.request('sendRawTransaction', [rawTx]);
      if (response.error) {
        throw new Error(`DAPI error: ${response.error.message}`);
      }
      return response.result;
    },
  },
  transition: {
    async sendRaw(rawTs) {
      const response = await dapi.request('sendRawTransition', [rawTs]);
      if (response.error) {
        throw new Error(`DAPI error: ${response.error.message}`);
      }
      return response.result;
    },
  },
};

module.exports = api;
