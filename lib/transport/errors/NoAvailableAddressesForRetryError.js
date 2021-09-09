const AbstractCausedTransportError = require('./AbstractCausedTransportError');

class NoAvailableAddressesForRetryError extends AbstractCausedTransportError {
  /**
   * @param {RequestError|ResponseError} cause
   */
  constructor(cause) {
    super(cause, cause.getDAPIAddress());

    this.message = `No available addresses for retry: ${cause.message}`;
  }

  /**
   *
   * @returns {Object}
   */
  getMetadata() {
    return this.cause.getMetadata();
  }
}

module.exports = NoAvailableAddressesForRetryError;
