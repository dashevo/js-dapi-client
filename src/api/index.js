const { DAPIService } = require('../services');

async function request(method, params) {
  const response = await DAPIService.request(method, params);
  if (response.error) {
    throw new Error(`DAPI error: ${method}: ${response.error.message}`);
  }
  return response.result;
}

const api = {
  address: {
    getUTXO: address => request('getUTXO', [address]),
    getBalance: address => request('getBalance', [address]),
  },
  user: {
    getData: usernameOrRegTxId => request('getUser', [usernameOrRegTxId]),
  },
  transaction: {
    sendRaw: rawTx => request('sendRawTransaction', [rawTx]),
  },
  transition: {
    sendRaw(rawTransition, dataPacket) {
      return request('sendRawTransition', [rawTransition, dataPacket]);
    },
  },
  block: {
    getBestBlockHeight: () => request('getBestBlockHeight'),
    getBlockHash: blockHeight => request('getBlockHash', [blockHeight]),
  },
};

module.exports = api;
