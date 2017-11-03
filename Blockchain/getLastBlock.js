exports.getLastBlock = function () {
  return new Promise(((resolve, reject) => {
    const keys = Object.keys(SDK.Blockchain.blocks);
    keys.sort();
    const lastHeight = keys[keys.length - 1];
    if (lastHeight) {
      resolve(SDK.Blockchain.blocks[lastHeight]);
    } else {
      reject(null);
    }
  })).then((lastHeight) => {
    resolve(lastHeight);
  }).catch((err) => {
    reject(err);
  });
};
