const API = require('./BaseAPI');

class AddressApi extends API {
  async getUTXO(address) {
    return this.makeGetRequest(`/addr/${addr}/utxo`);
  }
  async getBalance(address) {
    return this.makeGetRequest(`/addr/${addr}/balance`);
  }
}

module.exports = AddressApi;