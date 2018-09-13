const Api = require('../');
const helpers = require('../src/Helpers');
const { SpvChain } = require('@dashevo/dash-spv');

// Height used for poc (to save syning time)
const pocHeight = 2896;

// Go back 20 blocks
// Todo: DGW not allowing more than 24 blocks, low difficulty problem
const pocGenesis = pocHeight - 20;

let nullHash;
let api = null;
let headerChain = null;

const log = console;

async function getVerifiedMnList() {
  // null as target will use latest hash
  return getVerfiedMnList(offSetHash, [], null);
}

function validateCheckpoints(headerChain) {
  return true;
  // Todo:
}

async function validateCbTx(headerChain, cbTx) {
  const dashcore = require('@dashevo/dashcore-lib');
  const { MerkleProof } = require('@dashevo/dash-spv');
  const cbTxHash = new dashcore.Transaction(cbTx).getHash();

  // todo: spvchain currently do not keep track of height
  const header = headerChain.getLongestChain().filter(header => header.height === cbTx.height);

  return MerkleProof.validateMnProofs(header, proofs, cbTxHash);
}

async function logOutput(msg, delay = 50) {
  log.info(msg);
  await new Promise(resolve => setTimeout(resolve, delay));
}

// ==== Build HeaderChain
async function setTrustedMnLists() {
  const latestHash = await api.getBlockHash(await api.getBestBlockHeight());
  const trustedMnListDiff = await api.getMnListDiff(nullHash, latestHash);
  const trustedMnList = helpers.constructMnList([], trustedMnListDiff);

  // todo - change dapi architecture to accomodate setting new lists
  // api.MNDiscovery.masternodeListProvider.masternodeList.concat(trustedMnList);

  await logOutput(`Set Trusted MnList: mnlist length = ${trustedMnList.length}`);
}

async function getValidatedHeaderchain() {
  const dapinetGenesisHash = await api.getBlockHash(pocGenesis);
  const dapinetGenesisHeader = await api.getBlockHeader(dapinetGenesisHash);
  dapinetGenesisHeader.prevHash = '0000000000000000000000000000000000000000000000000000000000000000';
  // dapinetGenesisHeader.bits = +(`0x${dapinetGenesisHeader.bits}`);
  const numConfirms = 10000;

  headerChain = new SpvChain('custom_genesis', numConfirms, dapinetGenesisHeader);

  const maxHeaders = 24;
  for (let i = pocGenesis + 1; i <= pocHeight; i += maxHeaders) {
    /* eslint-disable-next-line no-await-in-loop */
    const newHeaders = await api.getBlockHeaders(i, maxHeaders);
    headerChain.addHeaders(newHeaders);
  }

  // NOTE: query a few nodes by repeating the process to make sure you on the longest chain
  // headerChain instance will automatically follow the longest chain, keep track of orphans, etc
  // implementation detail @ https://docs.google.com/document/d/1jV0zCie5rVbbK9TbhkDUbbaQ9kG9oU8XTAWMVYjRc2Q/edit#heading=h.trwvf85zn0se
  return headerChain;
}

async function BuildHeaderChain() {
  await setTrustedMnLists();
  await getValidatedHeaderchain();

  const verifiedMnList = await getVerifiedMnList();

  const validateCheckpoints = validateCheckpoints(headerChain);
  const isValidCbTx = await validateCbTx(headerChain, verifiedMnList.cbTx);

  log.info(`Node discvory ${isValidCbTx ? 'complete' : 'failed'}`);
}
// ==== Build HeaderChain

// ==== Client initial state

async function init() {
  api = new Api();
  // using genesiss as nullhash as core is bugged
  nullHash = await api.getBlockHash(0);
}

// ==== Client initial state

async function start() {
  await init(); // Client Initial state
  await BuildHeaderChain();
  await GetVerifiedMnList();
}

// will fail if executed
start();
