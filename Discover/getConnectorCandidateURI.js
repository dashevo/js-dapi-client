/* eslint-disable */
// TODO: Make this file pass linting!
const _ = require('lodash');

exports.getConnectorCandidateURI = function () {
  return `http://${_.sample(SDK.Discover.Masternode.candidateList).ip}`;
};
