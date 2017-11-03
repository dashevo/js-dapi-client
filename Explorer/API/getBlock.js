const explorerGet = require('../../Common/ExplorerHelper').explorerGet;

exports.getBlock = function (identifier) {
  return new Promise(((resolve, reject) => {
    const _id = null;

    Promise.resolve(Number.isInteger(identifier))
      .then(isInt => (isInt ? SDK.Explorer.API.getHashFromHeight(identifier) : identifier))
      .then(id => explorerGet(`/block/${id}`))
      .then((block) => {
        resolve(block);
      })
      .catch((error) => {
        reject(error);
      });
  }));
};
