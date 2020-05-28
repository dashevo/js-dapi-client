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
   * Get random address
   *
   * @returns {DAPIAddress}
   */
  getAddress() {
    const now = Date.now();

    const liveAddresses = this.addresses.filter((address) => {
      if (!address.isBanned()) {
        return true;
      }

      // Exponentially increase ban time based on ban count
      const banPeriod = Math.exp(address.getBanCount()) * this.options.baseBanTime;

      return now > address.getBanTime() + banPeriod;
    });

    return sample(liveAddresses);
  }
}

module.exports = ListDAPIAddressProvider;
