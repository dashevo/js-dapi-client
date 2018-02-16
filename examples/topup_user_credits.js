const { Address, TopUpSubTx } = require('../src').Core;
const { PrivateKey, PublicKey } = require('../src').Bitcore;
const { Api } = require('../src');

async function topUpUserCredits(regTxId, privateKeyString) {
  const privateKey = new PrivateKey(privateKeyString);
  const publicKey = PublicKey.fromPrivateKey(privateKey);
  // Change to livenet, if you want to create address for livenet
  // You need to topup this address first
  const address = Address
    .fromPublicKey(publicKey, 'testnet')
    .toString();

  const inputs = await Api.address.getUTXO(address);
  const subTx = new TopUpSubTx(regTxId);
  const fundingInDuffs = 1000 * 1000; // 0.01 Dash
  subTx.fund(fundingInDuffs, inputs, address).sign(privateKey);

  return Api.transaction.sendRaw(subTx.serialize());
}

module.exports = topUpUserCredits;
