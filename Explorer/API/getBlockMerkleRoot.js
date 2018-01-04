/* eslint-disable */
// TODO: Make this file pass linting!
exports.getBlockMerkleRoot = function (identifier) {
  return new Promise(((resolve, reject) => SDK.Explorer.API.getBlock(identifier)
    .then((_block) => {
      resolve(_block.merkleroot);
    })
    .catch((err) => {
      reject(err);
    })));
};
