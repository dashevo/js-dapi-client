const getBlockConfirmations = identifier =>
  new Promise(((resolve, reject) => SDK.Explorer.API.getBlock(identifier)
    .then((_block) => {
      resolve(_block.confirmations);
    })
    .catch(error => reject(error))));

module.exports = {
  getBlockConfirmations,
};
