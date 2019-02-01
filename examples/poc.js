/* eslint-disable import/no-extraneous-dependencies */
// Todo Extract each usecase into a helper function
const { SpvChain, MerkleProof } = require('@dashevo/dash-spv');
const dashcore = require('@dashevo/dashcore-lib');
const path = require('path');
const sinon = require('sinon');
const Api = require('../');
const MNDiscovery = require('../src/MNDiscovery/index');

const nullHash = '0000000000000000000000000000000000000000000000000000000000000000';
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// Go back 20 blocks
// Todo: DGW not allowing more than 24 blocks, low difficulty regtest problem

let api = null;
let headerChain = null;
const DAPI_IP = process.env.DAPI_IP ? process.env.DAPI_IP : '35.164.239.224';

const log = console;

async function logOutput(msg, delay = 50) {
  log.info(`${msg}`);
  await new Promise(resolve => setTimeout(resolve, delay));
}

// ==== Client initial state

async function init() {
  const seeds = [{ ip: DAPI_IP }];
  sinon.stub(MNDiscovery.prototype, 'getRandomMasternode')
    .returns(Promise.resolve({ ip: DAPI_IP }));
  api = new Api({ seeds, port: 3000 });
}

// ==== Client initial state

// ==== Build HeaderChain

async function getValidatedHeaderchain() {
  headerChain = new SpvChain('testnet');
  const latestHeight = await api.getBestBlockHeight();
  const maxHeaders = 24;
  for (let i = 1; i <= latestHeight; i += maxHeaders) {
    /* eslint-disable-next-line no-await-in-loop */
    const newHeaders = await api.getBlockHeaders(i, maxHeaders);
    headerChain.addHeaders(newHeaders);
    const syncPercent = ((i / latestHeight) * 100).toFixed(2);
    logOutput(`headerchain ${syncPercent} % synced`);
  }

  // NOTE: query a few nodes by repeating the process to make sure you on the longest chain
  // headerChain instance will automatically follow the longest chain, keep track of orphans, etc
  // implementation detail @ https://docs.google.com/document/d/1jV0zCie5rVbbK9TbhkDUbbaQ9kG9oU8XTAWMVYjRc2Q/edit#heading=h.trwvf85zn0se

  await logOutput(`Got headerchain with longest chain of length ${headerChain.getLongestChain().length}`);
}

async function validateCheckpoints(checkpoints) {
  if (checkpoints.every(cp => headerChain.getLongestChain().map(h => h.hash).includes(cp))) {
    await logOutput(`Checkpoints valid on headerChain ${headerChain.getLongestChain().length}`);
  } else {
    await logOutput('INVALID CHECKPOINT! please query more headers from other dapi nodes');
  }
}

async function BuildHeaderChain() { // eslint-disable-line no-unused-vars
  await getValidatedHeaderchain();

  // select 2 random from chain, in production this will be hardcoded
  const checkpoints = headerChain.getLongestChain()
    .map(h => h.hash)
    .sort(() => 0.5 - Math.random()); // 1 liner (sub optimal) shuffle hack
  // .slice(0, 2);

  await validateCheckpoints(checkpoints);

  logOutput('Build HeaderChain complete');
}

// ==== Build HeaderChain

// ==== Get Verified MnList

function isValidDiffListProofs(mnlistDiff, header) { // eslint-disable-line no-unused-vars
  // Add this code back when proofs available.
  return MerkleProof.validateMnProofs(
    header,
    mnlistDiff.cbTxMerkleTree.merkleFlags,
    mnlistDiff.cbTxMerkleTree.merkleHashes,
    mnlistDiff.cbTxMerkleTree.totalTransactions,
    mnlistDiff.cbTx.hash,
  );
}

async function getValidMnList() {
  const latestHash = await api.getBlockHash(await api.getBestBlockHeight());
  const diff = await api.getMnListDiff(nullHash, latestHash);
  // const cbTx = dashcore.Transaction.Payload.CoinbasePayload.fromBuffer(diff.cbTx);
  /*
  const cbTxHeader = await headerChain.getHeader(await api.getBlockHash(cbTx.height));
  if (!isValidDiffListProofs(diff, cbTxHeader)) {
    throw new Error ('INVALID MNLIST! please query other dapi nodes');
  }
  */
  const validMnList = new dashcore.SimplifiedMNList(diff).getValidMasternodesList();
  logOutput(`Set Trusted MnList: mnlist length = ${validMnList.length}`);
  return validMnList;
}

async function GetVerifiedMnList() {
  const verifiedMnList = await getValidMnList();
  // await logOutput(`Valid MNLIST on headerChain with tip ${headerChain.getTipHash()}`);
  console.log('verifiedMnList', verifiedMnList);
}

// ==== Get Verified MnList

async function start() {
  await init(); // Client Initial state
  // let's sync header chain once we can do it with dspv
  // await BuildHeaderChain();
  await GetVerifiedMnList();
}

start();
