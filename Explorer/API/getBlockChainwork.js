exports.getBlockChainwork = function (identifier) {
  return new Promise(((resolve, reject) => SDK.Explorer.API.getBlock(identifier)
    .then((_block) => {
      resolve(_block.chainwork);
    })
    .catch(err => reject(err))));
};
