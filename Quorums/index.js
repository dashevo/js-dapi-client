/* eslint-disable */
// TODO: Make this file pass linting!
const qDash = require('quorums-dash');
const registeredUser = require('../mocks/registeredUser');
const Discover = require('../Discover').Discover();

const { block: blockApi } = require('../src/api');

const getQuorum = () => {
  return blockApi.getBestBlockHeight()
    .then(height => blockApi.getBlockHash(qDash.getRefHeight(height)))
    .then(lastHash => qDash.getQuorum(
      Discover.Masternode.masternodeList.nodes, lastHash,
      JSON.parse(registeredUser).txid,
    ));
};

const updateQuorum = () => {
  return getQuorum()
    .then((quorum) => {
      Discover.Masternode.candidateList = quorum;
    });
};

module.exports = {
  getQuorum,
  updateQuorum,
};
