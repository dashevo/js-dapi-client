const axios = require('axios'),
  SpvUtils = require('../../util/SpvUtils'),
  _ = require('underscore'),
  fs = require('fs');


getStoredMasternodes = () => new Promise((resolve, reject) => {
  const path = './masterNodeList.dat'; // move to config

  if (fs.existsSync(path)) {
    resolve(fs.readFileSync());
  } else {
    resolve(null);
  }

  // todo: filter out old/outdated mastnernodes & some other logic?
});

getSeedUris = () => SDK._config.DISCOVER.DAPI_SEEDS
  .map(n => `${n.protocol}://${n.base}:${n.port}`);

getMnListsFromSeeds = () => new Promise((resolve, reject) => {
  Promise.all(getSeedUris().map(uri => axios.get(`${uri}/masternodes/list`)))
    .then((res) => {
      resolve(res.map(r => r.data));
    })
    .catch((err) => {
      console.log(err);
    });
});


const mnCount = 10; // random number of mns to connect to (move to config)
chooseRandomMns = mnLists => mnLists.map(mnList => _.sample(mnList, Math.round(mnLists.length / mnCount)));

// todo review switching between trusted insight servers and dapi nodes
// this implementation does not make sense
getMnObjFromInsightSeed = seed => ({
  vin: 'na',
  status: 'ENABLED',
  rank: 1,
  ip: seed.base + seed.path,
  protocol: 0,
  payee: 'na',
  activeseconds: 14556663,
  lastseen: 1502078628,
});

exports.fetcher = () => new Promise((resolve, reject) => {
  if (SDK._config.useTrustedServer) {
    resolve(SDK._config.DISCOVER.INSIGHT_SEEDS.map(n => getMnObjFromInsightSeed(n)));
  } else {
    getStoredMasternodes()
      .then((mns) => {
        if (mns) {
          resolve(mns);
        } else {
          return getMnListsFromSeeds();
        }
      })
      .then(mnLists => SpvUtils.getMnListOnLongestChain(mnLists))
      .then(bestMnList => SpvUtils.getSpvValidMns(bestMnList))
      .then((validMnList) => {
        if (validMnList) {
          resolve(validMnList);
        } else {
          reject('No valid MN found');
        }
      })
      .catch(err => console.log(err));
  }
});
