exports.getLastBlockHeight = function () {
  return new Promise(((resolve, reject) => SDK.Explorer.API.getStatus()
    .then((_status) => {
      resolve(_status.info.blocks);
    })
    .catch(err => reject(err))));
};
