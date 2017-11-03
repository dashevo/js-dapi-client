const explorerGet = require('../Common/ExplorerHelper').explorerGet;

exports.getTx = function (txid) {
  return new Promise(((resolve, reject) => {
    explorerGet(`/tx/${txid}`)
      .then(resp => resolve(resp))
      .catch(err => reject(err));
  }));
};
