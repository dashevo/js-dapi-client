//Todo: apply init process for trustedFactory.js
const quorums = require('quorums-dash')

DAPISDK = (useQuorums = true) => {
    global.SDK = {
        Accounts: require('../Accounts/').Accounts(),
        Explorer: require('../Explorer/').Explorer(),
        Discover: require('../Discover/').Discover(),
        BWS: require('../BWS/').BWS(),
        _config: require('../config.js')
    }

    return initDapi(useQuorums);
}

var initDapi = function(useQuorums) {
    return new Promise(function(resolve, reject) {

        SDK.Discover.Masternode.masternodeList = {
            hash: null,
            nodes: null
        }

        SDK.Discover.Masternode.fetcher()
            .then(fetched => {
                SDK.Discover.Masternode.masternodeList = {
                    hash: quorums.getHash(fetched.list),
                    nodes: fetched.list
                }
                SDK.Discover.Masternode.candidateList = SDK.Discover.Masternode.masternodeList.nodes

                if (useQuorums) {

                    updateQuorum()
                        .then(success => {
                            SDK.Discover.Masternode.candidateList = quorum
                            resolve(true)
                        })

                    startQuorumUpdater()
                }
                else {
                    resolve(true)
                }
            })
    })
}


//todo: no need to update quorum each time
//only mnList periodically, quorums only on quorum request
var startQuorumUpdater = function() {
    setInterval(updateQuorum, 60 * 1 * 1000) //1min todo: move to config
}

var updateQuorum = function() {
    return upDateMnList()
        .then(res => {
            return getQuorum()
        })
        .then(quorum => {
            SDK.Discover.Masternode.candidateList = quorum
            Promise.resolve(true)
        })
}

const refHeight = 100; //todo: move to config

var getQuorum = function() {

    return SDK.Explorer.API.getLastBlockHeight()
        .then(height => {
            return SDK.Explorer.API.getHashFromHeight(height - refHeight)
        })
        .then((lastHash) => {
            return quorums.getQuorum(SDK.Discover.Masternode.masternodeList.nodes, lastHash,
                JSON.parse(require('../Accounts/User/mocks/registeredUser')).txid);
        })
}

var updateMnList = function() {
    return SDK.Discover.Masternode.fetcher()
        .then(fetched => {
            switch (fetched.type) {
                case 'full':
                    SDK.Discover.Masternode.masternodeList = {
                        hash: quorums.getHash(fetched.list),
                        nodes: fetched.list
                    }
                    break;
                case 'update':
                    SDK.Discover.Masternode.masternodeList = {
                        hash: quorums.getHash(fetced.list),
                        nodes: fetched.list
                    }
                    break;
                case 'none':
                    //Nothing to do    
                    break;
            }
        })
}

module.exports = DAPISDK