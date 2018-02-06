const qDash = require('quorums-dash');

module.exports = {
  updateQuorum() {
    return getQuorum()
      .then((quorum) => {
        SDK.Discover.Masternode.candidateList = quorum;
      });
  },
};

var getQuorum = function () {
  return SDK.Explorer.API.getLastBlockHeight()
    .then(height => SDK.Explorer.API.getHashFromHeight(qDash.getRefHeight(height)))
    .then(lastHash => qDash.getQuorum(
      SDK.Discover.Masternode.masternodeList.nodes, lastHash,
      JSON.parse(require('../Accounts/User/mocks/registeredUser')).txid,
    ));
};

