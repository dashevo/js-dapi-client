const { explorerGet } = require('../Common/ExplorerHelper');
// TODO: Implement this
// const { getLastBlockHeight } = require('../Explorer/API/getLastBlockHeight');

const getFeeLevels = (network, cb) =>
  new Promise(((resolve, reject) => {
    explorerGet('/utils/estimatefee')
      .then(res =>
      // Pick the first value of the first key
        res[Object.keys(res)[0]])
      .then((fee) => {
        if (cb) {
          cb(null, fee);
        }
        return resolve(fee);
      })
      .catch(err => reject(err));
  }));

module.exports = {
  getFeeLevels,
};
