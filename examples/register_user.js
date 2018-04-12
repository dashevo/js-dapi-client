const BitcoreLib = require('bitcore-lib-dash');
const Api = require('../src/api');

const { PrivateKey, PublicKey, Address } = BitcoreLib;
const { Registration } = BitcoreLib.Transaction.SubscriptionTransactions;
const api = new Api();

async function registerUser(username, privateKeyString) {
  const privateKey = new PrivateKey(privateKeyString);
  const publicKey = PublicKey.fromPrivateKey(privateKey);
  // Change to livenet, if you want to create address for livenet
  // You need to top up this address first
  const address = Address
    .fromPublicKey(publicKey, 'testnet')
    .toString();

  // Getting available inputs
  console.log(address);
  const inputs = await api.getUTXO(address);

  const subTx = Registration.createRegistration(username, privateKey);
  // Must be bigger than dust amount
  const fundingInDuffs = 1000 * 1000; // 0.01 Dash

  const balance = await api.getBalance(address);

  if (!inputs.length) {
    throw new Error('No inputs!');
  }

  if (balance < fundingInDuffs) {
    console.log('Your balance is too small to perform user registration.');
    console.log(`Expected balance: ${fundingInDuffs / 100000000} DASH.`);
    console.log(`Address ${address} balance is ${balance}.`);
    console.log(`Please top up ${address}`);
    throw new Error('Insufficient funds');
  }

  subTx.fund(inputs, address, fundingInDuffs);
  subTx.sign(privateKey);

  // Send registration transaction to the network
  return api.sendRawTransaction(subTx.serialize());
}

module.exports = registerUser;
