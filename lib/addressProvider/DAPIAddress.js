const DAPIAddressHostMissingError = require('./errors/DAPIAddressHostMissingError');

class DAPIAddress {
  /**
   * @param {RawDAPIAddress|DAPIAddress|string} address
   */
  constructor(address) {
    if (address instanceof DAPIAddress) {
      return new DAPIAddress(address.toJSON());
    }

    if (typeof address === 'string') {
      // eslint-disable-next-line no-param-reassign
      address = {
        host: address,
        httpPort: DAPIAddress.DEFAULT_HTTP_PORT,
        grpcPort: DAPIAddress.DEFAULT_GRPC_PORT,
      };
    }

    if (!address.host) {
      throw new DAPIAddressHostMissingError();
    }

    this.host = address.host;
    this.httpPort = address.httpPort || DAPIAddress.DEFAULT_HTTP_PORT;
    this.grpcPort = address.grpcPort || DAPIAddress.DEFAULT_GRPC_PORT;
    this.proRegTxHash = address.proPegTxHash;

    this.banCount = 0;
    this.banStartTime = undefined;
  }

  /**
   * @returns {string}
   */
  getHost() {
    return this.host;
  }

  /**
   * @returns {number}
   */
  getHttpPort() {
    return this.httpPort;
  }

  /**
   * @returns {number}
   */
  getGrpcPort() {
    return this.grpcPort;
  }

  /**
   *
   * @return {*}
   */
  getProRegTxHash() {
    return this.proRegTxHash;
  }

  /**
   * @param {DAPIAddress} address
   * @returns {boolean}
   */
  isEqual(address) {
    return address.getProRegTxHash() && address.getProRegTxHash() === this.getProRegTxHash();
  }

  /**
   * @return {number}
   */
  getStartTime() {
    return this.banStartTime;
  }

  /**
   * @return {number}
   */
  getBanCount() {
    return this.banCount;
  }

  /**
   * Mark address as banned
   *
   * @return {DAPIAddress}
   */
  markAsBanned() {
    this.banCount += 1;
    this.banStartTime = Date.now();

    return this;
  }

  /**
   * Mark address as live
   *
   * @return {DAPIAddress}
   */
  markAsLive() {
    this.banCount = 0;
    this.banStartTime = undefined;

    return this;
  }

  /**
   * @return {boolean}
   */
  isBanned() {
    return this.banCount > 0;
  }

  /**
   * Return DAPIAddress as plain object
   *
   * @returns {RawDAPIAddress}
   */
  toJSON() {
    return {
      host: this.host,
      httpPort: this.httpPort,
      grpcPort: this.grpcPort,
    };
  }
}

DAPIAddress.DEFAULT_HTTP_PORT = 3000;
DAPIAddress.DEFAULT_GRPC_PORT = 3010;

/**
 * @typedef {Object} RawDAPIAddress
 * @property {string} host
 * @property {number} [httpPort=3000]
 * @property {number} [grpcPort=3010]
 * @property {string} [proPegTxHash]
 */

module.exports = DAPIAddress;
