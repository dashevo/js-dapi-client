// TODO: Implement this
// const { explorerGet } = require('../Common/ExplorerHelper');

const broadcastRawTx = (opts, network, rawTx, SDK) =>
  new Promise(((resolve, reject) => SDK
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

module.exports = {
  broadcastRawTx,
};
