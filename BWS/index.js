const { broadcastRawTx } = require('./broadcastRawTx');
const { getBalance } = require('./getBalance');
const { getFeeLevels } = require('./getFeeLevels');
const { getFiatRate } = require('./getFiatRate');
const { getMainAddress } = require('./getMainAddress');
const { getTx } = require('./getTx');
const { getTxHistory } = require('./getTxHistory');
const { getUtxos } = require('./getUtxos');

module.exports = {
  broadcastRawTx,
  getBalance,
  getFeeLevels,
  getFiatRate,
  getMainAddress,
  getTx,
  getTxHistory,
  getUtxos,
};
