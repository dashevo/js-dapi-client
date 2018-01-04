/* eslint-disable */
// TODO: Make this file pass linting!
exports.getLastDifficulty = function () {
  return new Promise(((resolve, reject) => SDK.Explorer.API.getStatus()
    .then((_status) => {
      resolve(_status.info.difficulty);
    })
    .catch(err => reject(err))));
};
