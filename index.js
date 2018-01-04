const Accounts = require('./Accounts');
const Blockchain = require('./Blockchain');
const Discover = require('./Discover');
const Explorer = require('./Explorer');
const SPV = require('./SPV');

const api = (options) => {
  if (options) {
    console.warn('Logging levels have not been implemented yet');
  }
  return {
    Accounts,
    Blockchain,
    Discover,
    Explorer,
    SPV,
  };
};

module.exports = api;
