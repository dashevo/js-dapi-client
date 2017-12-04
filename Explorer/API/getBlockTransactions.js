exports.getBlockTransactions = function (identifier) {
  return new Promise(((resolve, reject) => SDK.Explorer.API.getBlock(identifier)
    .then((_block) => {
      resolve(_block.tx);
    })
    .catch(err => reject(err))));
};
