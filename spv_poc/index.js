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

}

main().catch((e) => {
  log.error(e.stack);
  process.exit(1);
});
