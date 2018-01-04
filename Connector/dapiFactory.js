const Accounts = require('../Accounts').Accounts();
const Discover = require('../Discover').Discover();
const Blockchain = require('../Blockchain').Blockchain();
const SPV = require('../SPV');
const config = require('../config.js');

module.exports = {
  Accounts,
  Discover,
  Blockchain,
  SPV,
  config,
};
