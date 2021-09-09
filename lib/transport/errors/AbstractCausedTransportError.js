const GrpcError = require('@dashevo/grpc-common/lib/server/error/GrpcError');
const AbstractTransportError = require('./AbstractTransportError');

class AbstractCausedTransportError extends AbstractTransportError {
  /**
   * @param {GrpcError|AbstractConsensusError} cause
   * @param {DAPIAddress} dapiAddress
   */
  constructor(cause, dapiAddress) {
    super(cause.message);

    this.cause = cause;

    this.dapiAddress = dapiAddress;
  }

  /**
   * @returns {GrpcError|AbstractConsensusError}
   */
  getCause() {
    return this.cause;
  }

  /**
   *
   * @returns {DAPIAddress}
   */
  getDapiAddress() {
    return this.dapiAddress;
  }

  /**
   *
   * @returns {number}
   */
  getCode() {
    return this.cause.getCode();
  }

  /**
   *
   * @returns {Object}
   */
  getMetadata() {
    if (this.error instanceof GrpcError) {
      return this.error.getRawMetadata();
    }

    return {};
  }
}

module.exports = AbstractCausedTransportError;
