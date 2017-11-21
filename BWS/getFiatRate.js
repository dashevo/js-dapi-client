// TODO: Implement this
// const { explorerGet } = require('../Common/ExplorerHelper');

const getFiatRate = (opts, ccyCode, ts) =>
  new Promise(((resolve) =>
    resolve({ ts: Date.now() - 3000, rate: 120, fetchedOn: Date.now() })));

module.exports = {
  getFiatRate,
};
