const Blockchain = require('./Blockchain');
const Discover = require('./Discover');

const api = (options) => {
  if (options) {
    console.warn('Logging levels have not been implemented yet');
  }
  return {
    Blockchain,
    Discover,
  };
};

module.exports = {
  api,
};
