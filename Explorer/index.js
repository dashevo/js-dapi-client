const { getStatus } = require('./API/getStatus');
const { getMasternodeList } = require('./API/getMasternodeList');
const { getBlock } = require('./API/getBlock');
const { getHashFromHeight } = require('./API/getHashFromHeight');
const { getLastBlockHash } = require('./API/getLastBlockHash');
const { getBlockHeaders } = require('./API/getBlockHeaders');
const { getBlockConfirmations } = require('./API/getBlockConfirmations');
const { getBlockSize } = require('./API/getBlockSize');
const { getBlockBits } = require('./API/getBlockBits');
const { getBlockChainwork } = require('./API/getBlockChainwork');
const { getBlockMerkleRoot } = require('./API/getBlockMerkleRoot');
const { getBlockTransactions } = require('./API/getBlockTransactions');
const { getBlockTime } = require('./API/getBlockTime');
const { getBlockVersion } = require('./API/getBlockVersion');
const { getHeightFromHash } = require('./API/getHeightFromHash');
const { getLastDifficulty } = require('./API/getLastDifficulty');
const { getLastBlockHeight } = require('./API/getLastBlockHeight');
const { getLastBlock } = require('./API/getLastBlock');
const { getBalance } = require('./API/address');
const { getUTXO } = require('./API/address');
const { send } = require('./API/tx');
const { getTx } = require('./API/tx');
const { estimateFees } = require('./API/utils');

module.exports = {
  getStatus,
  getMasternodeList,
  getBlock,
  getHashFromHeight,
  getLastBlockHash,
  getBlockHeaders,
  getBlockConfirmations,
  getBlockSize,
  getBlockBits,
  getBlockChainwork,
  getBlockMerkleRoot,
  getBlockTransactions,
  getBlockTime,
  getBlockVersion,
  getHeightFromHash,
  getLastDifficulty,
  getLastBlockHeight,
  getLastBlock,
  getBalance,
  getUTXO,
  send,
  getTx,
  estimateFees,
};