const getBlockBits = (identifier, SDK) =>
  new Promise(((resolve, reject) => SDK.Explorer.API.getBlock(identifier)
    .then((_block) => {
      resolve(_block.bits);
    })
    .catch((err) => {
      reject(err);
    })));

module.exports = {
  getBlockBits,
};
