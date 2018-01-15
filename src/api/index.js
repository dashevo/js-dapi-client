const jayson = require('jayson/promise');

// Local dapi instance. For testing purposes only
const LOCAL_DAPI_PORT = 3000;
const MN_BOOTSTRAP_DAPI_PORT = 6001;

const DAPIService = {
  lastClient: 0,
  clients: [
    jayson.client.http({ port: MN_BOOTSTRAP_DAPI_PORT }),
  ],
  getClient() {
    this.lastClient = (this.lastClient + 1) % this.clients.length;
    return this.clients[this.lastClient];
  },
  request(method, args) {
    const client = this.getClient();
    return client.request(method, args);
  },
};

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
