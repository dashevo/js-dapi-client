const explorerGet = require('../../Common/ExplorerHelper').explorerGet;

exports.getMasternodeList = function () {
  return new Promise(((resolve, reject) => {
    explorerGet('/masternodes/list')
      .then((data) => {
        resolve(data);
      })
      .catch((error) => {
        reject(`An error was triggered while fetching masternode list :${error}`);
      });
  }));
};
