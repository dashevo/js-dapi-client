const { Address, RegSubTx } = require('../src').Core;
const { PrivateKey, PublicKey } = require('../src').Bitcore;
const { Api } = require('../src');

async function registerUser(username, privateKeyString) {
  const privateKey = new PrivateKey(privateKeyString);
  const publicKey = PublicKey.fromPrivateKey(privateKey);
  // Change to livenet, if you want to create address for livenet
  // You need to top up this address first
  const address = Address
    .fromPublicKey(publicKey, 'testnet')
    .toString();

  // Getting available inputs
  const inputs = await Api.address.getUTXO(address);

  const subTx = new RegSubTx(username, privateKey);
  // Must be bigger than dust amount
  const fundingInDuffs = 1000 * 1000; // 0.01 Dash

  const balance = await Api.address.getBalance(address);
  console.log(address);
  console.log(balance);

  if (balance < fundingInDuffs) {
    console.log('Your balance is too small to perform user registration.');
    console.log(`Expected balance: ${fundingInDuffs / 100000000} DASH.`);
    console.log(`Address ${address} balance is ${balance}.`);
    console.log(`Please top up ${address}`);
    throw new Error('Insufficient funds');
  }

  subTx
    .fund(fundingInDuffs, inputs)
    .sign(privateKey);

  // Send registration transaction to the network
  return Api.transaction.sendRaw(subTx.serialize());
}

module.exports = registerUser;
