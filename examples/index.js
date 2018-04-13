const registerUser = require('./register_user');
const topupUserCredit = require('./topup_user_credits');
const Api = require('../src/api');
const { privateKeyString } = require('./data');

const api = new Api();

async function main() {
  // Generating random username
  const username = Math.random().toString(36).substring(7);
  console.log('Your random username for this run is:');
  console.log(username);
  // Sending registration to network
  await registerUser(username, privateKeyString);
  // Caution: this will work only in regtest mode.
  console.log('Minig block to confirm transaction.');
  await api.generate(1);
  // Checking user data
  let blockchainUser = await api.getUser(username);
  console.log('User credits:', blockchainUser.credits);
  // To up user credits
  await topupUserCredit(blockchainUser.regtxid, privateKeyString);
  // Caution: this will work only in regtest mode.
  console.log('Minig block to confirm transaction.');
  await api.generate(1);
  // Check user data
  blockchainUser = await api.getUser(username);
  console.log('User credits after top up:', blockchainUser.credits);
  process.exit(0);
}

main().catch((e) => {
  console.error(e.stack);
  process.exit(1);
});
