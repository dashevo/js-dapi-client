const getBlockChainwork = (identifier, SDK) =>
  new Promise(((resolve, reject) => SDK.Explorer.API.getBlock(identifier)
    .then((_block) => {
      resolve(_block.chainwork);
    })
    .catch(err => reject(err))));

module.exports = {
  getBlockChainwork,
};
