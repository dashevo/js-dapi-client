const qDash = require('quorums-dash');
const { txid } = require('../../Accounts/User/mocks/registeredUser');

const getQuorum = (SDK = global.SDK) =>
  SDK.Explorer.API.getLastBlockHeight()
    .then(height => SDK.Explorer.API.getHashFromHeight(qDash.getRefHeight(height)))
    .then(lastHash => qDash.getQuorum(
      SDK.Discover.Masternode.masternodeList.nodes, lastHash,
      txid,
    ));

const updateQuorum = (SDK = global.SDK) =>
  getQuorum()
    .then((quorum) => {
      // TODO: Update design to not require reassignment
      // eslint-disable-next-line no-param-reassign
      SDK.Discover.Masternode.candidateList = quorum;
    });

module.exports = {
  getQuorum,
  updateQuorum,
};
