const refHeight = 100; //todo: move to config

module.exports = {
    updateQuorum: function() {
        getQuorum()
            .then(quorum => {
                SDK.Discover.Masternode.candidateList = quorum
            })
    },
}

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

