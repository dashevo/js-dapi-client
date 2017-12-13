// TODO: move explorer to that folder

const Explorer = require('../../Explorer');
const address = require('../../Explorer/API/user');
const user = require('../../Explorer/API/user');

const api = {
  address,
  user,
  transactions: {
    sendRaw: Explorer.send,
  },
  transitions: {
    async sendRaw() { /* todo */ },
  },
};

module.exports = api;
