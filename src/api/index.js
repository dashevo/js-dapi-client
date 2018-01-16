const request = require('./request');

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
