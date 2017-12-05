const Accounts = require('./Accounts');
const Blockchain = require('./Blockchain');
const BWS = require('./BWS');
const Discover = require('./Discover');
const Explorer = require('./Explorer');
const SPV = require('./SPV');
const Wallet = require('./Wallet');
const Interfaces = require('./Interfaces');

const api = (options) => {
  if (options) {
    console.warn('Logging levels have not been implemented yet');
  }
  return {
    Interfaces,
    Accounts,
    Blockchain,
    BWS,
    Discover,
    Explorer,
    SPV,
    Wallet,
  };
};

module.exports = api;
