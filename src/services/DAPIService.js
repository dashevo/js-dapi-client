const { Client: RPCClient } = require('jayson/promise');
const MNDiscoveryService = require('./MNDiscoveryService');

async function getRandomClient() {
  const randomMasternode = await MNDiscoveryService.getRandomMasternode();
  return RPCClient.http({
    host: randomMasternode.host,
    port: randomMasternode.port,
  });
}

async function getClient() {
  return getRandomClient();
}

async function request(method, args) {
  const client = await getClient();
  return client.request(method, args);
}

const DAPIService = {
  request,
};

module.exports = DAPIService;
