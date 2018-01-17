const registeredUser = require('../mocks/registeredUser');

const mockedRegTxId = JSON.parse(registeredUser).txid;
const Discover = require('../Discover').Discover();
const { QuorumService } = require('../src/services');

async function updateQuorum() {
  const quorum = await QuorumService.getQuorumForUser(mockedRegTxId);
  Discover.Masternode.candidateList = quorum;
}

module.exports = {
  updateQuorum,
};
