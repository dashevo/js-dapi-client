const { Masternode } = require('./Masternode');

exports.Discover = function () {
  return {
    _state: 'waiting',
    Masternode: Masternode(),
    getConnectorCandidateURI: require('./getConnectorCandidateURI').getConnectorCandidateURI,
    getSocketCandidate: require('./getSocketCandidate').getSocketCandidate,
  };
};
