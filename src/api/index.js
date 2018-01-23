const DAPI = require('./DAPIClient');
// There is no destructuring for a purpose of testability - request method of that object is stubbed
// in test, which is not possible when using destructuring.

const api = {
  address: {
    getUTXO: address => DAPI.request('getUTXO', [address]),
    getBalance: address => DAPI.request('getBalance', [address]),
  },
  user: {
    getUser: usernameOrRegTxId => DAPI.request('getUser', [usernameOrRegTxId]),
  },
  transaction: {
    sendRaw: rawTx => DAPI.request('sendRawTransaction', [rawTx]),
  },
  transition: {
    sendRaw(rawTransition, dataPacket) {
      return DAPI.request('sendRawTransition', [rawTransition, dataPacket]);
    },
  },
  block: {
    getBestBlockHeight: () => DAPI.request('getBestBlockHeight', []),
    getBlockHash: blockHeight => DAPI.request('getBlockHash', [blockHeight]),
  },
};

module.exports = api;
