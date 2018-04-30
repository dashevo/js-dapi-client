const Api = require('../src/api');
const data = require('./data');
const config = require('../src/config');
const bloomFilter = require('bloom-filter');
const dashcore = require('bitcore-lib-dash');
const { SpvChain } = require('dash-spv');
const ui = require('log-update');
const { MerkleProof } = require('dash-spv');

const log = console;

let chain = null;
let startHeight = 0;
let filter = 0;
let txOutput = ``;

// Setting port to local instance of DAPI.
// Comment this line if you want to use default port that points to
// mn-bootstrap
config.Api.port = 3000;
const api = new Api();

function createFilter(ref) {
  const client = data[ref];

  const filter =
    bloomFilter.create(client.noElements, client.fpRate, 0, bloomFilter.BLOOM_UPDATE_ALL);
  const pubKey = new dashcore.PrivateKey(client.privateKeySeed).toPublicKey();
  filter.insert(dashcore.crypto.Hash.sha256ripemd160(pubKey.toBuffer()));

  return filter;
}

function headerCollector() {
  api.getBestBlockHeight()
    .then((currHeight) => {
      const deltaHeight = currHeight - (chain.getChainHeight() + startHeight);
      if (deltaHeight > 0) {
        return api.getBlockHeaders(chain.getChainHeight() + startHeight + 1, deltaHeight);
      }
      return null;
    }).then((headersObj) => {
      if (headersObj && headersObj.headers.length > 0) {
        chain.addHeaders(headersObj.headers);
      }
    });
}

function getSpvTransactions() {

  let txData = [];

  return api.getSpvData(filter)
    .then(data => {
      if (data) {
        //get unique tx hashes and push to arr
        data.transactions
          .map(txObj => txObj.hash)
          .filter((txHash, index, self) => self.indexOf(txHash) === index)
          .map(txHash => {
            txData.push({
              txHash: txHash,
              merkleBlock: null,
            })
          })

        txData.forEach(tx => {
          //Todo: confirm & improve reversal logic
          let reversedTx = new Buffer(tx.txHash, 'hex').reverse().toString('hex');
          tx.merkleBlock = data.merkleblocks.filter(mb => mb.hashes.includes(reversedTx))[0];
        })
      }

      return txData;
    })
}

function writeOutput(transactions) {

  Promise.all(transactions.map(tx => {
    return new Promise((resolve, reject) => {

      if (tx.merkleBlock) {
        chain.getBlock(tx.merkleBlock.header.hash)
          .then(localBlock => {
            resolve(`
            ${tx.txHash} ${
              tx.merkleBlock && localBlock && MerkleProof(tx.merkleBlock, localBlock, tx.txHash) ?
                "(Confirmed on chain)" : "(UNCONFIRMED)"}`)
          })
      }
      else {
        resolve(`${tx.txHash} "(UNCONFIRMED!)"}`)
      }

    })
  }))
    .then(txData => {
      ui(`
      Checkpoint block    : ${startHeight}
  
      Current block       : ${chain.getChainHeight() + startHeight} (+${chain.getChainHeight()})
  
      Last block hash     : ${chain.getTipHash()}
  
      Longest Chain POW   : ${chain.getBestFork().getPOW()}
  
      ==============================================================================================
  
      Orphan Chains       : ${chain.getAllForks().length - 1}
  
      ==============================================================================================
  
      Transactions        : ${txData}`);
    })
}

function outputGenerator() {
  getSpvTransactions()
    .then(transactions => writeOutput(transactions))
}

async function main() {
  dashcore.Networks.defaultNetwork = dashcore.Networks.testnet;
  filter = createFilter(data.constants.CLIENT_1).toObject();
  api.loadBloomFilter(filter);

  process.stdout.write('\033c');
  api.getBestBlockHeight()
    .then((currHeight) => {
      startHeight = currHeight - 20;
      return api.getBlockHeaders(startHeight, 1);
    })
    .then((headerObj) => {
      chain = new SpvChain('custom_genesis', headerObj.headers[0]);
      headerCollector(); setInterval(headerCollector, 10000);
      setInterval(outputGenerator, 2000);
    });
}

main().catch((e) => {
  log.error(e.stack);
  process.exit(1);
});
