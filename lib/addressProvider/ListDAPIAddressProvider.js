const sample = require('lodash.sample');

class ListDAPIAddressProvider {
  /**
   * @param {DAPIAddress[]} addresses
   * @param {DAPIClientOptions} [options]
   */
  constructor(addresses, options = {}) {
    this.options = {
      baseBanTime: 60 * 1000,
      ...options,
    };

    this.addresses = addresses;
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
   * Get random address
   *
   * @returns {Promise<DAPIAddress>}
   */
  async getLiveAddress() {
    const liveAddresses = this.getLiveAddresses();

    return sample(liveAddresses);
  }

  /**
   * Get all addresses
   *
   * @return {DAPIAddress[]}
   */
  getAllAddresses() {
    return this.addresses;
  }

  /**
   * Check if we have live addresses left
   *
   * @return {Promise<boolean>}
   */
  async hasLiveAddresses() {
    const liveAddresses = this.getLiveAddresses();

    return liveAddresses.length > 0;
  }

  /**
   * Get live addresses list
   *
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

      return now > address.getStartTime() + banPeriod;
    });
  }
}

module.exports = ListDAPIAddressProvider;
