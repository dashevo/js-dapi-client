const Masternode = require('./Masternode/').Masternode;
exports.Discover = function() {
    let self = this;
    return {
        _state: "waiting",
        Masternode: Masternode(),
        getDapiCandidate: require('./getDapiCandidate').getDapiCandidate,
        getDapiCandidateURI: require('./getDapiCandidateURI').getDapiCandidateURI,
        getSocketCandidate: require('./getSocketCandidate').getSocketCandidate,
        init: require('./init').init
    };
};