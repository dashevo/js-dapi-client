//Todo: apply init process for trustedFactory.js
const quorumManager = require('../libs/quorum-dash')

DAPISDK = (useQuorums = true) => {
    global.SDK = {
        Accounts: require('../Accounts/').Accounts(),
        Explorer: require('../Explorer/').Explorer(),
        Discover: require('../Discover/').Discover(),
        BWS: require('../BWS/').BWS(),
        _config: require('../config.js')
    }

    return new Promise(function(resolve, reject) {

        SDK.Discover.Masternode.fetcher()
            .then(fetched => {
                if (!fetched || fetched.length == 0) {
                    reject('Explorer.API will throw an error if called as it has no INSIGHT-API seeds provided.');
                }
                else {
                    SDK.Discover.Masternode.candidateList = fetched;
                    updateQuorum(fetched).then(quorum => {
                        SDK.Discover.Masternode.candidateList = useQuorums ? quorum : fetched;
                        setQuorumUpdater();
                        resolve(true);
                    })
                }
            })
            .catch(err => {
                reject(err)
            })
    });
}

var setQuorumUpdater = function() {
    setInterval(updateQuorum, 60 * 1 * 1000) //1min todo: move to config
}

const refHeight = 100; //todo: move to config

var updateQuorum = function(mnList) {
    return SDK.Explorer.API.getLastBlockHeight()
        .then(height => {
            return SDK.Explorer.API.getHashFromHeight(height - refHeight)
        }).then(hash => {
            return quorumManager.getQuorum(mnList, hash);
        })
}


module.exports = DAPISDK