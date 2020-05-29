const sample = require('lodash.sample');

class ListDAPIAddressProvider {
  /**
   * @param {DAPIAddress[]} addresses
   * @param {DAPIClientOptions} [options]
   */
  constructor(addresses, options = {}) {
    this.options = Object.assign(options, {
      baseBanTime: 60 * 1000,
    });

    this.addresses = addresses;
  }

  /**
   * Get all addresses
   *
   * @return {DAPIAddress[]}
   */
  getAddresses() {
    return this.addresses;
  }

  /**
   * Add an address
   *
   * @param {DAPIAddress} address
   */
  addAddress(address) {
    this.addresses.push(address);
  }

  /**
   * Remove address
   */
  removeAddress() {

  }

  /**
   * Get live addresses list
   *
   * @private
   * @return {DAPIAddress[]}
   */
  getLiveAddresses() {
    const now = Date.now();

    return this.addresses.filter((address) => {
      if (!address.isBanned()) {
        return true;
      }

      // Exponentially increase ban time based on ban count
      const banPeriod = Math.exp(address.getBanCount()) * this.options.baseBanTime;

      return now > address.getBanTime() + banPeriod;
    });
  }

  /**
   * Get random address
   *
   * @returns {Promise<DAPIAddress>}
   */
  async getAddress() {
    const liveAddresses = this.getLiveAddresses();

    return sample(liveAddresses);
  }

  /**
   * Check if we have live addresses left
   *
   * @return {Promise<boolean>}
   */
  async hasAddresses() {
    const liveAddresses = this.getLiveAddresses();

    return liveAddresses.length > 0;
  }
}

module.exports = ListDAPIAddressProvider;
