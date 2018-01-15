const jayson = require('jayson/promise');

const LOCAL_DAPI_PORT = 3000;
const MN_BOOTSTRAP_DAPI_PORT = 6001;

const DAPIService = {
  lastClient: 0,
  clients: [
    jayson.client.http({ port: MN_BOOTSTRAP_DAPI_PORT }),
  ],
  getClient() {
    this.lastClient = (this.lastClient + 1) % this.clients.length;
    return this.clients[this.lastClient];
  },
  request(method, args) {
    const client = this.getClient();
    return client.request(method, args);
  },
};

module.exports = DAPIService;