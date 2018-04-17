const registerUser = require('./register_user');
const topupUserCredit = require('./topup_user_credits');
const Api = require('../src/api');
const { privateKeyString } = require('./data');
const config = require('../src/config');

const log = console;

// Setting port to local instance of DAPI.
// Comment this line if you want to use default port that points to
// mn-bootstrap
config.Api.port = 3000;

const api = new Api();

async function main() {
  // Generating random username
  const username = Math.random().toString(36).substring(7);
  log.info('Your random username for this run is:');
  log.info(username);
  // Sending registration to network
  // Note: in this example we assume that account owner is the same
  // person who funds registration, so only one private key is used.
  // Otherwise, owner should create registration transaction and
  // sign it with his own private key, and then pass it to the
  // funder, which will also sign this transaction with his key.
  await registerUser(username, privateKeyString);
  // Caution: this will work only in regtest mode.
  log.info('Mining block to confirm transaction.');
  log.info('Block hash is', await api.generate(1));
  // Checking user data
  let blockchainUser = await api.getUser(username);
  log.info('User profile:', blockchainUser);
  // To up user credits
  await topupUserCredit(blockchainUser.regtxid, privateKeyString);
  // Caution: this will work only in regtest mode.
  log.info('Mining block to confirm transaction.');
  log.info('Block hash is', await api.generate(1));
  // Check user data
  blockchainUser = await api.getUser(username);
  log.info('User credits after top up:', blockchainUser.credits);
  process.exit(0);
}

main().catch((e) => {
  log.error(e.stack);
  process.exit(1);
});
