const { explorerGet } = require('../Common/ExplorerHelper');

const getTx = txid =>
  new Promise(((resolve, reject) => {
    explorerGet(`/tx/${txid}`)
      .then(resp => resolve(resp))
      .catch(err => reject(err));
  }));

module.exports = {
  getTx,
};
