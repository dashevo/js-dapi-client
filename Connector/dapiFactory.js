const Discover = require('../Discover').Discover();
const Blockchain = require('../Blockchain').Blockchain();
const SPV = require('../SPV');
const config = require('../config.js');

module.exports = {
  Discover,
  Blockchain,
  SPV,
  config,
};
