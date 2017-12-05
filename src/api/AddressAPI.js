const API = require('./BaseAPI');

class AddressApi extends API {
  async getUTXO(address) {
    return this.makeGetRequest(`/addr/${address}/utxo`);
  }
  async getBalance(address) {
    return this.makeGetRequest(`/addr/${address}/balance`);
  }
}

module.exports = AddressApi;
