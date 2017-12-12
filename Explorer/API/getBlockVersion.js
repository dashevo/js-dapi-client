/* eslint-disable */
// TODO: Make this file pass linting!
exports.getBlockVersion = function (identifier) {
  return new Promise(((resolve, reject) => SDK.Explorer.API.getBlock(identifier)
    .then(_block => resolve(_block.version))
    .catch(err => reject(err))));
};
