const registerUser = require('./register_user');
const topupUserCredit = require('./topup_user_credits');
const createDapContract = require('./register_dap');
const updateUserState = require('./update_user_state');
const Schema = require('@dashevo/dash-schema/lib');
const Api = require('../src/api');
const Bitcore = require('@dashevo/dashcore-lib');
const { privateKeyString } = require('./data');

const user1HDKey = new Bitcore.HDPrivateKey();
const user2HDKey = new Bitcore.HDPrivateKey();
const derivingPath = 'm/1';

const log = console;

// This id is depends on user, who registered this dap.
// Actually, DashPay id will be different for each run
// until you paste your dashpay id here
let dashPayId = 'b4de10e1ddb8e225cd04a406deb98e6081f9bd26f98f46c0932d0bdfb2bd0623';

const api = new Api({ port: 3010 });

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
  let blockchainUser = await api.getUserByName(username);
  log.info('User profile:', blockchainUser);

  // Registering second user, which we will use later in this example
  const otherUserUsername = Math.random().toString(36).substring(7);
  const otherUserId = await registerUser(otherUserUsername, privateKeyString);
  log.info('Second user is', otherUserUsername, otherUserId);

  // To up user credits
  await topupUserCredit(blockchainUser.regtxid, privateKeyString);
  // Caution: this will work only in regtest mode.
  log.info('Mining block to confirm transaction.');
  log.info('Block hash is', await api.generate(1));

  // Check user data
  blockchainUser = await api.getUserByName(username);
  log.info('User credits after top up:', blockchainUser.credits);

  // Registering dap, if it's not registered already:
  let dashPayDataContract = await api.getDapContract(dashPayId);

  if (!dashPayDataContract) {
    log.info('DashPay data contract not found. Creating one');
    dashPayId = await createDapContract(
      Schema.Daps.DashPay,
      privateKeyString,
      blockchainUser.regtxid,
    );
    log.info(dashPayId);
    // Confirming dap contract creation on-chain
    await api.generate(1);
    // Checking if it's really created
    dashPayDataContract = await api.getDapContract(dashPayId);
  } else {
    log.info('DashPay contract is already created. No need to create one');
  }

  log.info('DashPay data contract:');
  log.info(dashPayDataContract);

  // This code is DashPay-specific.

  log.info('Creating other user to demonstrate DashPay functionality');
  // await api.generate(10);
  // Registering other user to which we want to send friend request
  // const otherUserUsername = Math.random().toString(36).substring(7);
  // const otherUserId = await registerUser(otherUserUsername, privateKeyString);
  // log.info('Second user:', otherUserUsername, otherUserId);

  log.info(`Creating friend request from ${username} to ${otherUserUsername}`);
  // Creating "contact" object
  const contactRequest = Schema.create.dapobject('contact');
  // Generate an HD public key for the user
  contactRequest.contact.hdextpubkey = user1HDKey
    .derive(derivingPath).hdPublicKey.toString();
  // Setting a relation to that user in object. Later this user can retrieve this object
  // from DAPI with getDapContext
  contactRequest.contact.relation = otherUserId.txid;
  log.info('Contact request object:');
  log.info(contactRequest);

  // End of DashPay-specific code.

  log.info('Sending contact request to the network');
  await updateUserState(dashPayId, blockchainUser.regtxid, [contactRequest], privateKeyString);

  log.info('Mining block to confirm changes');
  // Generate 1 block to confirm transition
  await api.generate(1);

  // Check first user dap space - contact request should appear there:

  let user1Space = await api.getUserDapSpace(dashPayId, blockchainUser.regtxid);
  log.info(`${username}'s DashPay dap space:`);
  log.info(user1Space);
  log.info('Contact request in the first user\'s space:');
  log.info(user1Space.objects[0]);

  // Check second user dap context - friend request should appear there:

  /*
  NOTE: If you get error around this line that says 'Cannot read property...'
  You probably has different users stored in virtual dashdrive and dashcore.
  It can happen if you flushed regtest data in dashcore, but not in virtual dashdrive.
  To fix this, go to DAPI folder and delete vmn/stack-db.json
   */
  const user2Context = await api.getUserDapContext(dashPayId, otherUserId.txid);
  log.info(`${otherUserUsername}'s DahPay dap context:`);
  log.info(user2Context);
  log.info('Contact request in the second user\'s space:');
  log.info(user2Context.related[0]);

  // Now we need to accept first user contact request, i.e. create contact object
  // on second user side, referencing first user's id:

  log.info(`Accepting contact request from ${otherUserUsername} by ${username}`);
  // Creating "contact" object
  const contactAcceptance = Schema.create.dapobject('contact');
  // Generate an HD public key for the user
  contactAcceptance.contact.hdextpubkey = user2HDKey
    .derive(derivingPath).hdPublicKey.toString();
  // Setting a relation to that user in object. Later this user can retrieve this object
  // from DAPI with getDapContext
  contactAcceptance.contact.relation = blockchainUser.regtxid;
  log.info('Contact request object:');
  log.info(contactAcceptance);

  // End of DashPay-specific code.

  log.info('Sending contact request to the network');
  await updateUserState(dashPayId, otherUserId.txid, [contactAcceptance], privateKeyString);

  log.info('Mining block to confirm changes');
  // Generate 1 block to confirm transition
  await api.generate(1);

  user1Space = await api.getUserDapSpace(dashPayId, blockchainUser.regtxid);
  log.info(`${username}'s DashPay dap space:`);
  log.info(user1Space);
  log.info('Contact in the first user\'s space:');
  log.info(user1Space.objects[0]);

  const user2Space = await api.getUserDapSpace(dashPayId, otherUserId.txid);
  log.info(`${otherUserUsername}'s DashPay dap space:`);
  log.info(user2Space);
  log.info('Contact in the second user\'s space:');
  log.info(user2Space.objects[0]);

  process.exit(0);
}

main().catch((e) => {
  log.error(e.stack);
  process.exit(1);
});
