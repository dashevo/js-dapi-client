const { Address, RegSubTx } = require('../src').Core;
const { PrivateKey, PublicKey } = require('../src').Bitcore;
const { Api } = require('../src');
const { privateKeyString } = require('./data');
const { confirmationPrompt } = require('./helpers');

async function registerUser() {
  const privateKey = new PrivateKey(privateKeyString);
  const publicKey = PublicKey.fromPrivateKey(privateKey);
  // Change to livenet, if you want to create address for livenet
  // You need to topup this address first
  const address = Address.fromPublicKey(publicKey, 'testnet');
  const username = Math.random().toString(36).substring(7);
  console.log('address', address.toString());

  // Retrieveing available inputs
  const inputs = await Api.address.getUTXO(address.toString());
  console.log('Inputs:');
  console.log(inputs);

  const subTx = new RegSubTx(username, privateKey);
  // Must be bigger than dust amount
  const fundingInDuffs = 1000 * 1000; // 0.01 Dash

  const balance = await Api.address.getBalance(address.toString());

  console.log('balance:');
  console.log(balance);

  if (balance < fundingInDuffs) {
    console.log('Your balance is too small to perform user registration.');
    console.log(`Expected balance: ${fundingInDuffs / 100000000} DASH.`);
    console.log(`Address ${address.toString()} balance is ${balance}.`);
    console.log(`Please top up ${address.toString()}`);
    throw new Error('Insufficient funds');
  }

  await subTx.fund(fundingInDuffs, inputs);
  subTx.sign(privateKey);
  console.log('Subscription transaction:');
  console.log(subTx.toObject());

  const txid = await Api.transaction.sendRaw(subTx.serialize());
  console.log('SubTx hash:');
  console.log(txid);

  console.log(`
    **********************************************************************************
    * Now you need your transaction to be confirmed. If you running this code on     *
    * testnet, you need to wait until block will be mined, 2.5 minutes average.      *
    * If you running this code on regtest, you can mine block by executing in        *
    * your terminal following line:                                                  *
    * dash-cli generate 1                                                            *
    * Please press any key after you did this to resume                              *
    **********************************************************************************`);

  await confirmationPrompt();

  /* NOTE: TRANSACTION NEEDS TO BE CONFIRMED FIRST.
      YOU WILL GET AND ERROR 'User not found' IF YOU DIDN'T WAIT FOR BLOCK  */

  // You can paste your random generated username username here
  const userData = await Api.user.getUser(username);
  return userData;
}

module.exports = registerUser;