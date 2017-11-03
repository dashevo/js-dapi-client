const explorerGet = require('../Common/ExplorerHelper').explorerGet;

exports.getFiatRate = function (opts, ccyCode, ts, provider) {
  return new Promise(((resolve, reject) => resolve({ ts: Date.now() - 3000, rate: 120, fetchedOn: Date.now() })));
};
