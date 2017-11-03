const explorerGet = require('../Common/ExplorerHelper').explorerGet;

exports.broadcastRawTx = function (opts, network, rawTx) {
  return new Promise(((resolve, reject) => SDK
    .Explorer
    .API
    .send(rawTx)
    .then((res) => {
      console.log(res);
      return resolve(res);
    })
    .catch((err) => {
      console.log(err);
      reject(err);
    })));
};
