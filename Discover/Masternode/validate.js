/* eslint-disable */
// TODO: Make this file pass linting!
const has = require('../../src/util/has.js');
const requesterJSON = require('../../src/util/requesterJSON.js');
const { uuid } = require('khal');

canPing = mn => new Promise(((resolve, reject) => {
  const uri = `${mn.fullBase + mn.connectorPath}/status`;
  requesterJSON.get(uri)
    .then((resp) => {
      if ((resp && resp.hasOwnProperty('info'))) {
        resolve(mn);
      } else {
        // pvr: some error handling
      }
    })
    .catch((err) => {
      resolve(false);
      // not pingabe do nothing (perhaps some logging)
    });
}));

exports.isPingable = mnList => new Promise(((resolve, reject) => {
  Promise.all(mnList.map(ul => canPing(ul)))
    .then((validList) => {
      resolve(validList.filter(i => i != false));
    })
    .catch((err) => {
      console.log(err);
    });
}));

isSpvAuthenticated = mn => true;
