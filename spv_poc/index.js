const Api = require('../src/api');
const data = require('./data');
const config = require('../src/config');
const bloomFilter = require('bloom-filter');
const dashcore = require('bitcore-lib-dash');
const { SpvChain } = require('dash-spv');
// const Merkleproof = require('@dashevo/dash-spv/lib/merkleproof');

const log = console;
let chain = null;
let startHeight = 0;

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

function start() {
  api.getBestBlockHeight()
    .then((currHeight) => {
      startHeight = currHeight;
      return api.getBlockHeaders(currHeight, 1);
    })
    .then((headerObj) => {
      chain = new SpvChain('custom_genesis', headerObj.headers[0]);
      setInterval(headerCollector, 1000);
    });
}

async function main() {
  dashcore.Networks.defaultNetwork = dashcore.Networks.testnet;
  api.loadBloomFilter(createFilter(data.constants.CLIENT_1).toObject());

  start();
}

main().catch((e) => {
  log.error(e.stack);
  process.exit(1);
});
