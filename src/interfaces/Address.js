const { Address: BitcoreAddress } = require('bitcore-lib-dash');
const { addressApi } = require('../api');

class Address extends BitcoreAddress {
  async getUTXO() {
    return addressApi.getUTXO(this.toString());
  }

  async getBalance() {
    return addressApi.getBalance(this.toString());
  }
}

module.exports = Address;
