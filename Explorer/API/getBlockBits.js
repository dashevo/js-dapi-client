exports.getBlockBits = function (identifier) {
  return new Promise(((resolve, reject) => SDK.Explorer.API.getBlock(identifier)
    .then((_block) => {
      resolve(_block.bits);
    })
    .catch((err) => {
      reject(err);
    })));
};
