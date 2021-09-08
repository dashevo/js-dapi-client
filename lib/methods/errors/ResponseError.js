const DAPIClientError = require('../../errors/DAPIClientError');

class ResponseError extends DAPIClientError {
  /**
   *
   * @param {number} code
   * @param {string} message
   * @param {module:grpc.Metadata} metadata
   * @param {DAPIAddress} dapiAddress
   */
  constructor(code, message, metadata, dapiAddress) {
    super(message);

    this.code = code;
    this.metadata = metadata;
    this.dapiAddress = dapiAddress;
  }

  /**
   *
   * @returns {string}
   */
  getDapiAddress() {
    return this.dapiAddress.toString();
  }

  /**
   *
   * @returns {number}
   */
  getCode() {
    return this.code;
  }

  /**
   *
   * @returns {object}
   */
  getMetadata() {
    return this.metadata;
  }
}

module.exports = ResponseError;
