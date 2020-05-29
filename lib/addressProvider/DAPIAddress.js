const InvalidDAPIAddressError = require('./errors/InvalidDAPIAddressError');

class DAPIAddress {
  /**
   * @param {RawDAPIAddress|DAPIAddress|string} address
   */
  constructor(address) {
    if (address instanceof DAPIAddress) {
      return this;
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
      throw new InvalidDAPIAddressError('host');
    }

    if (!address.httpPort) {
      throw new InvalidDAPIAddressError('httpPort');
    }

    if (!address.grpcPort) {
      throw new InvalidDAPIAddressError('grpcPort');
    }

    this.host = address.host;
    this.httpPort = address.httpPort;
    this.grpcPort = address.grpcPort;

    this.banCount = 0;
    this.banTime = undefined;
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
   * @param {DAPIAddress} address
   * @returns {boolean}
   */
  isEqual(address) {
    return address.getHost() === this.getHost()
      && address.getHttpPort() === this.getHttpPort();
  }

  /**
   * @return {number}
   */
  getBanTime() {
    return this.banTime;
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
    // TODO: Rename to "banStartTime" or "bannedAt"
    this.banTime = Date.now();

    return this;
  }

  /**
   * Mark address as live
   *
   * @return {DAPIAddress}
   */
  markAsLive() {
    this.banCount = 0;
    this.banTime = undefined;

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
 * @property {number} httpPort
 * @property {number} grpcPort
 */

module.exports = DAPIAddress;
