exports.getLastBlock = function () {
  return new Promise(((resolve, reject) => {
    SDK.Explorer.API.getLastBlockHash()
      .then(lastHash => SDK.Explorer.API.getBlock(lastHash))
      .then((block) => {
        resolve(block);
      });
  }));
};
