const Api = require('../src/api');
const data = require('./data');
const config = require('../src/config');
const bloomFilter = require('bloom-filter');
const dashcore = require('bitcore-lib-dash');

const log = console;

// Setting port to local instance of DAPI.
// Comment this line if you want to use default port that points to
// mn-bootstrap
config.Api.port = 3000;

dashcore.Networks.defaultNetwork = dashcore.Networks.testnet;

const api = new Api();

function createFilter(ref) {
  const client = data[ref];

  const filter =
    bloomFilter.create(client.noElements, client.fpRate, 0, bloomFilter.BLOOM_UPDATE_ALL);
  const pubKey = new dashcore.PrivateKey(client.privateKeySeed).toPublicKey();
  filter.insert(dashcore.crypto.Hash.sha256ripemd160(pubKey.toBuffer()));

  return filter;
}

async function main() {
  await api.loadBloomFilter(createFilter(data.constants.CLIENT_1).toObject());
}


main().catch((e) => {
  log.error(e.stack);
  process.exit(1);
});
