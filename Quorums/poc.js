const config = require('../config');
const { explorerPost } = require('../Common/ExplorerHelper');
const message = require('bitcore-message-dash');
const Mnemonic = require('bitcore-mnemonic-dash');
const registeredUser = require('../Accounts/User/mocks/registeredUser');

const REFSDK = config.useTrustedServer ? require('../Connector/dapiFactory.js');

const options = { // no effect for dapi - using defaults
  verbose: false,
  errors: false,
  warnings: false,
  debug: false,
  DISCOVER: {
    INSIGHT_SEEDS: [
      /* {
                protocol: 'http',
                path: "insight-api-dash",
                base: "51.15.5.18",
                port: 3001
            }, */
      {
        protocol: 'https',
        path: '/insight-api-dash',
        base: 'dev-test.dash.org',
        port: 443,
      },
    ],
  },
};

REFSDK(options)
  .then((ready) => {
    if (ready) {
      const mockUser = JSON.parse(registeredUser);
      const data = {
        owner: 'Alice', receiver: 'Bob', type: 'contactReq', txId: mockUser.txid,
      };

      const mnemonic = new Mnemonic('jaguar paddle monitor scrub stage believe odor frown honey ahead harsh talk');
      const privKey = mnemonic.toHDPrivateKey().derive('m/1').privateKey;
      const signature = message(JSON.stringify(data)).sign(privKey);

      explorerPost('/quorum', {
        verb: 'add',
        qid: 0,
        data,
        signature,
      });
    } else {
      console.log('SDK not initialised');
    }
  });

// Override node promises (workaround debug issues)
global.Promise = require('bluebird');

// new Promise((resolve, reject) => {
//     breaksomething() //won't pause
// })
