const explorerGet = require('../Common/ExplorerHelper').explorerGet;

exports.getTxHistory = function (opts, skip = 0, limit = 0, includeExtendedInfo) {
  return new Promise(((resolve, reject) => {
    const promises = [];

    function fetchingTxHistoryWithExtendedInfo(response) {
      response.transactions.forEach((txId) => {
        promises.push(explorerGet(`/tx/${txId}`));
      });
      return Promise
        .all(promises)
        .then(res => resolve(res));
    }
    if (!opts.hasOwnProperty('addr')) {
      return reject('Missing param addr in opts');
    }
    return explorerGet(`/addr/${opts.addr}?from=${skip}&to=${limit}`)
      .then(response => (includeExtendedInfo ? fetchingTxHistoryWithExtendedInfo(response) : resolve(response.transactions)))
      .catch((error) => {
        if (error) {
          return reject(`An error was triggered getting getTxHistory${error}`);
        }
      });
  }));
};
