
const spvchain = require('../libs/spv-dash/lib/spvchain'),
  merkleproof = require('../libs/spv-dash/lib/merkleproof');

let chain = null;

module.exports = {

  initChain(fileStream, chainType) {
    return new Promise((resolve, reject) => {
      chain = new spvchain(fileStream, chainType);

      chain.on('ready', () => {
        resolve(true);
      });
    });
  },

  getTipHash() {
    return chain.getTipHash();
  },

  addBlockHeaders(headers) {
    chain._addHeaders(headers);
    return chain.getChainHeight();
  },

  validateTx(blockHash, txHash) {
    return chain.getBlock(blockHash)
      .then(block => merkleproof(block, txHash));
  },

  applyBloomFilter(addr) {
    // Todo
  },
};
