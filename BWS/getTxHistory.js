const { explorerGet } = require('../Common/ExplorerHelper');
const { has } = require('../util/has');

const getTxHistory = (opts, skip = 0, limit = 0, includeExtendedInfo) =>
  new Promise(((resolve, reject) => {
    const promises = [];

    const fetchingTxHistoryWithExtendedInfo = (response) => {
      response.transactions.forEach((txId) => {
        promises.push(explorerGet(`/tx/${txId}`));
      });
      return Promise
        .all(promises)
        .then(res => resolve(res));
    };
    if (!has(opts, 'addr')) {
      reject(new Error('Missing param addr in opts'));
    }
    return explorerGet(`/addr/${opts.addr}?from=${skip}&to=${limit}`)
      .then(response =>
        (includeExtendedInfo ? fetchingTxHistoryWithExtendedInfo(response) :
          resolve(response.transactions)))
      .catch((error) => {
        if (error) {
          reject(new Error(`An error was triggered getting getTxHistory${error}`));
        }
      });
  }));

module.exports = {
  getTxHistory,
};
