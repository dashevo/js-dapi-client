exports.getBlock = function () {
  const self = this;
  return async function (height) {
    return new Promise((async (resolve, reject) => {
      if (!self.Blockchain.blocks.hasOwnProperty(height)) {
        const block = await self.Blockchain.blocks[height];
        return resolve(block);
      }
    }));
  };
};
