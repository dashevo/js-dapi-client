const { Address, RegSubTx } = require('../src').Core;
const { PrivateKey } = require('../src').Bitcore;
const { Api } = require('../src');
const { privateKeyString } = require('./data');
const { confirmationPrompt } = require('./helpers');

async function registerUser() {
  const privateKey = new PrivateKey(privateKeyString);
  const address = new Address();
  const username = Math.random().toString(36).substring(7);

  // Retrieveing available inputs
  const inputs = await address.getUTXO();
  console.log('Inputs:');
  console.log(inputs);

  const subTx = new RegSubTx(username, privateKey);
  const fundingInDuffs = 1000 * 1000; // 0.01 Dash

  const balance = await Api.a.getBalance();
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

  const txid = await subTx.send();
  console.log('SubTx hash:');
  console.log(txid);

  console.log(`
    **********************************************************************************
    * Now you need your transaction to be confirmed. You can do this by executing in *
    * your terminal following line:                                                  *
    * dash-cli generate 1                                                            *
    * Please press any key after you did this to resume                              *
    **********************************************************************************`);

  await confirmationPrompt();

  /* NOTE: TRANSACTION NEEDS TO BE CONFIRMED FIRST.
      YOU WILL GET AND ERROR 'User not found' HERE  */

  // You can paste your random generated username username here
  const userData = await User.getUserData(username);
  return userData;
}

module.exports = registerUser;