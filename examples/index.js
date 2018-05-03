const registerUser = require('./register_user');
const topupUserCredit = require('./topup_user_credits');
const createDapContract = require('./register_dap');
const updateUserState = require('./update_user_state');
const Schema = require('@dashevo/dash-schema/lib');
const Api = require('../src/api');
const Bitcore = require('@dashevo/dashcore-lib');
const { privateKeyString } = require('./data');

const HDKey = '';
// const config = require('../src/config');

const log = console;

// Setting port to local instance of DAPI.
// Comment this line if you want to use default port that points to
// mn-bootstrap
// config.Api.port = 3001;

const dashPayId = '';

const api = new Api();

async function main() {
  // Generating random username
  const username = Math.random().toString(36).substring(7);
  log.info('Your random username for this run is:');
  log.info(username);
  // Sending registration to the network
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

  // Registering dap, if it's not registered already:
  let dashPayDataContract = await api.getDapContract(dashPayId);

  if (!dashPayDataContract) {
    log.info('DashPay data contract not found. Creating one');
    const contract = Schema.create.dapcontract(Schema.Daps.DashPay);
    await createDapContract(contract);
    // Confirming dap contract creation on-chain
    await api.generate(1);
    // Checking if it's really created
    dashPayDataContract = await api.getDapContract(dashPayId);
  }

  log.info('DashPay data contract:');
  log.info(dashPayDataContract);

  // This code is DashPay-specific.

  // Creating "contact" object
  const contactRequest = Schema.create.dapobject('contact');

  // Registering other user to which we want to send friend request
  const otherUserUsername = Math.random().toString(36).substring(7);
  const otherUserId = await registerUser(otherUserUsername, privateKeyString);

  // Generate an HD public key for the user
  contactRequest.contact.hdextpubkey = new Bitcore
    .HDPrivateKey(HDKey)
    .derive('m/1').hdPublicKey.toString();
  // Setting a relation to that user in object. Later this user can retrieve this object
  // from DAPI with getDapContext
  contactRequest.contact.relation = otherUserId;

  const objects = [contactRequest];

  // End of DashPay-specific code.

  await updateUserState(dashPayId, objects, privateKeyString);

  // Generate 1 block to confirm transition
  await api.generate(1);

  // Check first user dap space - contact request should appear there:

  const user1Space = await api.getUserDapSpace(dashPayId, blockchainUser.regTxId);

  log.info('First user dap space:');
  log.info(user1Space);

  // Check second user dap context - friend request should appear there:

  const user2Context = await api.getUserDapContext(dashPayId, otherUserId);
  log.info('Second user dap space:');
  log.info(user2Context);

  // Now we need to accept first user contact request, i.e. create contact object
  // on second user side, referencing first user's id:

  process.exit(0);
}

main().catch((e) => {
  log.error(e.stack);
  process.exit(1);
});
