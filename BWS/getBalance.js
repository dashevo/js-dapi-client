// TODO: Implement this
// const { explorerGet } = require('../Common/ExplorerHelper');

const getBalance = (twoStep, cb, addy, SDK) =>
  new Promise(((resolve, reject) => {
    SDK
      .Explorer
      .API
      .getBalance(addy)
      .then(res => resolve(res))
      .catch(err => reject(err));
  }));

module.exports = {
  getBalance,
};
