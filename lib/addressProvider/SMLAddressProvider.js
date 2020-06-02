const sample = require('lodash.sample');

class SMLAddressProvider {
  constructor(dmlProvider, listAddressProvider) {
    this.dmlProvider = dmlProvider;
    this.listAddressProvider = listAddressProvider;
  }

  async getAddress() {
    const list = await this.dmlProvider.getMastetrnodeList();

    this.listAddressProvider.getLiveAddress();

    return sample(list);
  }
}

module.exports = SMLAddressProvider;
