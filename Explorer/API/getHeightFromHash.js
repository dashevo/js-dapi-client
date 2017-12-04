const _fetch = require('../../util/fetcher.js')._fetch;

exports.getHeightFromHash = function (hash) {
  return new Promise((async (resolve, reject) => {
    SDK.Explorer.API.getBlock(hash)
      .then((_block) => {
        resolve(_block.height);
      })
      .catch(err => reject(err));
  }));
};
