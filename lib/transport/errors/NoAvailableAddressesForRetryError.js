const DAPIClientError = require('../../errors/DAPIClientError');

class NoAvailableAddressesForRetryError extends DAPIClientError {
  /**
   * @param {Error} error
   * @param {DAPIAddress} dapiAddress
   */
  constructor(error, dapiAddress) {
    super(`No available addresses for retry: ${error.message}`);

    this.error = error;
    this.dapiAddress = dapiAddress;
  }

  /**
   * @returns {Error}
   */
  getError() {
    return this.error;
  }

  /**
   *
   * @returns {string}
   */
  getDapiAddress() {
    return this.dapiAddress.toString();
  }
}

module.exports = NoAvailableAddressesForRetryError;
