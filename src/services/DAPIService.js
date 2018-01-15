/*
This module is making requests to DAPI and used by API module.
 */

const { Client: RPCClient } = require('jayson/promise');
const { port } = require('../config').DAPI;
const MNDiscoveryService = require('./MNDiscoveryService');

async function getRandomClient() {
  const randomMasternode = await MNDiscoveryService.getRandomMasternode();
  // todo: do we need to take port from masternode list?
  return RPCClient.http({ host: randomMasternode.ip, port });
}

async function getClient() {
  return getRandomClient();
}

async function request(method, args) {
  const client = getClient();
  return client.request(method, args);
}

const DAPIService = {
  request,
};

module.exports = DAPIService;
