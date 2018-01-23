const MNDiscoveryService = require('../services/MNDiscoveryService');
const rpcClient = require('../util/rpcClient');
const config = require('../config');

async function makeRequestToRandomDAPINode(method, params) {
  const randomMasternode = await MNDiscoveryService.getRandomMasternode();
  return rpcClient.request({ host: randomMasternode.ip, port: config.DAPI.port }, method, params);
}

/**
 * Makes request to random DAPI node.
 * @param {string} method
 * @param {array|object} params
 * @returns {Promise<*>}
 */
async function request(method, params) {
  const response = await makeRequestToRandomDAPINode(method, params);
  if (response.error) {
    throw new Error(`DAPI error: ${method}: ${response.error.message}`);
  }
  return response.result;
}

module.exports = { request };
