const Api = require('../../src/api');
const clientData = require('./data');
const config = require('../../src/config');
const bloomFilter = require('bloom-filter');
const dashcore = require('bitcore-lib-dash');
const { SpvChain } = require('@dashevo/dash-spv');
const ui = require('log-update');
const { MerkleProof } = require('@dashevo/dash-spv');

const log = console;

let chain = null;
let startHeight = 0;

// Setting port to local instance of DAPI.
// Comment this line if you want to use default port that points to
// mn-bootstrap
config.Api.port = 3000;
const api = new Api();

function createFilter(ref) {
  const client = clientData[ref];
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

function getSpvTransactions(filter) {
  return api.getSpvData(filter)
    .then((data) => {
      if (data) {
        return data.transactions
          .map(txObj => txObj.hash)
          .filter((txHash, index, self) => self.indexOf(txHash) === index)
          // get unique ^^
          .map(txHash =>
            ({
              txHash,
              merkleBlock: data.merkleblocks.filter(mb => mb.hashes.includes(Buffer.from(txHash, 'hex').reverse().toString('hex')))[0],
              // Todo: confirm & improve reversal logic ^^
            }));
      }
      return null;
    });
}

function writeOutput(filter) {
  getSpvTransactions(filter)
    .then((transactions) => {
      Promise.all(transactions.map(tx => new Promise((resolve) => {
        if (tx.merkleBlock) {
          chain.getBlock(tx.merkleBlock.header.hash)
            .then((localBlock) => {
              resolve(`${tx.txHash}: ${tx.merkleBlock && localBlock && MerkleProof(tx.merkleBlock, localBlock, tx.txHash) ?
                '(Confirmed on chain)' : '(UNCONFIRMED)'}`);
            });
        } else {
          resolve(`${tx.txHash}: (UNCONFIRMED)`);
        }
      })))
        .then((txData) => {
          ui(`
          Checkpoint block    : ${startHeight}
      
          Current block       : ${chain.getChainHeight() + startHeight} (+${chain.getChainHeight()})
      
          Last block hash     : ${chain.getTipHash()}
      
          Longest Chain POW   : ${chain.getBestFork().getPOW()}
      
    
          ==============================================================================================
          Orphan Chains       : ${chain.getAllForks().length - 1}
      
    
          ==============================================================================================
          Transactions        : 
          (yj62dAADEBbryoSMG6TcosmH9Gu2asXwat)
          ${txData.map(tx => `\n\t\t ${tx}`)}
    
          ==============================================================================================
          Transitions        :
    
          *** Coming Soon (TM) ***
    
          `);
        });
    });
}

async function main() {
  const filter = createFilter(clientData.constants.CLIENT_1).toObject();

  dashcore.Networks.defaultNetwork = dashcore.Networks.testnet;
  api.loadBloomFilter(filter);

  process.stdout.write('\x1Bc');
  api.getBestBlockHeight()
    .then((currHeight) => {
      startHeight = currHeight - 20;
      return api.getBlockHeaders(startHeight, 1);
    })
    .then((headerObj) => {
      chain = new SpvChain('custom_genesis', headerObj.headers[0]);
      headerCollector(); setInterval(headerCollector, 10000);
      setInterval(() => writeOutput(filter), 2000);
    });
}

main().catch((e) => {
  log.error(e.stack);
  process.exit(1);
});
