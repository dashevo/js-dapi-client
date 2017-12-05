const { explorerGet } = require('../../Common/ExplorerHelper');

const getBlock = (identifier, SDK) =>
  new Promise(((resolve, reject) => {
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

module.exports = {
  getBlock,
};
