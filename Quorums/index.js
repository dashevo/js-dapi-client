/* eslint-disable */
// TODO: Make this file pass linting!
const qDash = require('quorums-dash');
const registeredUser = require('../Accounts/User/mocks/registeredUser');

const getQuorum = (SDK) => {
  return SDK.Explorer.API.getLastBlockHeight()
    .then(height => SDK.Explorer.API.getHashFromHeight(qDash.getRefHeight(height)))
    .then(lastHash => qDash.getQuorum(
      SDK.Discover.Masternode.masternodeList.nodes, lastHash,
      JSON.parse(registeredUser).txid,
    ));
};

const updateQuorum = (SDK) => {
  return getQuorum()
    .then((quorum) => {
      SDK.Discover.Masternode.candidateList = quorum;
    });
};

module.exports = {
  getQuorum,
  updateQuorum,
};
