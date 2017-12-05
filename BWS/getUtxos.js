const { explorerGet } = require('../Common/ExplorerHelper');
// TODO: Implement this
// const { getLastBlockHeight } = require('../Explorer/API/getLastBlockHeight');

const getUtxos = (opts, addresses) =>
  new Promise(((resolve, reject) => {
    const promises = [];
    addresses.forEach((address) => {
      promises.push(explorerGet(`/addr/${address}/utxo`));
    });
    return Promise
      .all(promises)
      .then(res => resolve(res[1]))
      .catch(err => reject(err));
  }));

module.exports = {
  getUtxos,
};
