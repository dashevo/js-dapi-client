const Accounts = require('../Accounts/').Accounts();
const Explorer = require('../Explorer/').Explorer();
const Discover = require('../Discover/').Discover();
const BWS = require('../BWS/').BWS();
const Blockchain = require('../Blockchain/').Blockchain();
const SPV = require('../SPV/');
const config = require('../config.js');

module.exports = {
  Accounts,
  Explorer,
  Discover,
  BWS,
  Blockchain,
  SPV,
  config,
};
