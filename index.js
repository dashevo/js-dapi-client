const Blockchain = require('./Blockchain');

const api = (options) => {
  if (options) {
    console.warn('Logging levels have not been implemented yet');
  }
  return {
    Blockchain,
  };
};

module.exports = {
  api,
};
