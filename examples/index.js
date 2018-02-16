const registerUser = require('./register_user');
const topupUserCredit = require('./topup_user_credits');
const { Api } = require('../src');
const { privateKeyString } = require('./data');
const { confirmationPrompt } = require('./helpers');

async function main() {
  // Generating random username
  const username = Math.random().toString(36).substring(7);
  // Sending registration to network
  await registerUser(username, privateKeyString);
  // Waiting for transaction to be confirmed
  await confirmationPrompt();
  // Checking user data
  let blockchainUser = await Api.user.getUser(username);
  console.log('User credits:', blockchainUser.credits);
  // To up user credits
  await topupUserCredit(blockchainUser.regtxid, privateKeyString);
  // Waiting for transaction to be confirmed
  await confirmationPrompt();
  // Check user data
  blockchainUser = await Api.user.getUser(username);
  console.log('User credits after top up:', blockchainUser.credits);
  process.exit(0);
}

main().catch((e) => {
  console.error(e.stack);
  process.exit(1);
});
