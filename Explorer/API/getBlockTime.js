/* eslint-disable */
// TODO: Make this file pass linting!
exports.getBlockTime = function (identifier) {
  return new Promise(((resolve, reject) => SDK.Explorer.API.getBlock(identifier)
    .then((_block) => {
      resolve(_block.time);
    })
    .catch(err => reject(err))));
};
