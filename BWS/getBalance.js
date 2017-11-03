const explorerGet = require('../Common/ExplorerHelper').explorerGet;

exports.getBalance = function (twoStep, cb, addy) {
  return new Promise(((resolve, reject) => {
    SDK
      .Explorer
      .API
      .getBalance(addy)
      .then(res => resolve(res))
      .catch(err => reject(err));
  }));
};
