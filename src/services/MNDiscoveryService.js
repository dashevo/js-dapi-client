/*
This module responsibility is to obtain masternode IPs in order to
provide this IPs for DAPIService, which provides an interface
for making requests to DAPI.
 */

const { DAPISeeds, masternodeUpdateInterval } = require('../config');
const quorums = require('quorums-dash');
const sample = require('lodash/sample');
const { Client: RPCClient } = require('jayson');

let masternodesList = Object.assign({}, DAPISeeds);
let masternodesListLastUpdate = 0;

async function fetchMNList() {
  const randomMasternode = sample(masternodesList);
  const client = RPCClient.http({
    host: randomMasternode.host,
    port: randomMasternode.port,
  });
  const newMNList = await client.request('getMNList', []);
  return newMNList;
}

async function updateQuorum() {
  // todo: what this function should do?
}

async function updateMasternodesList() {
  if (Date.now() - masternodeUpdateInterval > masternodesListLastUpdate) {
    const newMNList = await fetchMNList();
    masternodesList = newMNList;
    masternodesListLastUpdate = Date.now();
  }
}

const MNDiscoveryService = {
  async getMNList() {
    await updateMasternodesList();
    return masternodesList;
  },
  async getRandomMasternode() {
    const MNList = await this.getMNList();
    return sample(MNList);
  },
};

module.exports = MNDiscoveryService;
