const { Client: RPCClient } = require('jayson/promise');
const MNDiscoveryService = require('../services/MNDiscoveryService');
const config = require('../config');

async function getRandomClient() {
  const randomMasternode = await MNDiscoveryService.getRandomMasternode();
  return RPCClient.http({
    host: randomMasternode.ip,
    port: config.DAPI.port,
  });
}

async function makeRequestToRandomDAPINode(method, args) {
  const client = await getRandomClient();
  return client.request(method, args);
}

/**
 * Makes request to random DAPI node.
 * @param {string} method
 * @param {array|object} params
 * @returns {Promise<void>}
 */
async function request(method, params) {
  const response = await makeRequestToRandomDAPINode(method, params);
  if (response.error) {
    throw new Error(`DAPI error: ${method}: ${response.error.message}`);
  }
  return response.result;
}

module.exports = request;
