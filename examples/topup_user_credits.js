const Api = require('../src/api');
const BitcoreLib = require('@dashevo/dashcore-lib');

const { Address, PrivateKey, PublicKey } = BitcoreLib;
const { TopUp } = BitcoreLib.Transaction.SubscriptionTransactions;
const api = new Api({ port: 3010 });

/**
 * Tops up user credits. Note that anyone can top up user credits.
 * @param {string} regTxId
 * @param {string} privateKeyString
 * @returns {Promise<string>}
 */
async function topUpUserCredits(regTxId, privateKeyString) {
  const privateKey = new PrivateKey(privateKeyString);
  const publicKey = PublicKey.fromPrivateKey(privateKey);
  // Change to livenet, if you want to create address for livenet
  // You need to topup this address first
  const address = Address
    .fromPublicKey(publicKey, 'testnet')
    .toString();

  const inputs = await api.getUTXO(address);
  const fundingInDuffs = 1000 * 1000; // 0.01 Dash
  const subTx = new TopUp();
  subTx.fund(regTxId, fundingInDuffs, inputs, address).sign(privateKey);

  return api.sendRawTransaction(subTx.serialize());
}

module.exports = topUpUserCredits;
