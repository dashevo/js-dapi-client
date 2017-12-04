exports.getBlockSize = function (identifier) {
  return new Promise(((resolve, reject) => SDK.Explorer.API.getBlock(identifier)
    .then((_block) => {
      resolve(_block.size);
    })
    .catch(err => reject(err))));
};
