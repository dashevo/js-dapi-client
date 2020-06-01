const GrpcErrorCodes = require('@dashevo/grpc-common/lib/server/error/GrpcErrorCodes');

const MaxRetriesReachedError = require('./errors/MaxRetriesReachedError');
const NoAvailableAddressesForRetry = require('./errors/NoAvailableAddressesForRetry');

class GrpcTransport {
  /**
   * @param {createDAPIAddressProviderFromOptions} createDAPIAddressProviderFromOptions
   * @param {ListDAPIAddressProvider|DMLAddressProvider|DAPIAddressProvider} addressProvider
   * @param {DAPIClientOptions} globalOptions
   */
  constructor(createDAPIAddressProviderFromOptions, addressProvider, globalOptions) {
    this.createDAPIAddressProviderFromOptions = createDAPIAddressProviderFromOptions;
    this.addressProvider = addressProvider;
    this.globalOptions = globalOptions;

    this.lastUsedAddress = null;
  }

  /**
   * Make request to DAPI node
   *
   * @param {Function} ClientClass
   * @param {string} method
   * @param {Object} requestMessage
   * @param {DAPIClientOptions} [options]
   *
   * @returns {Promise<Object>}
   */
  async request(ClientClass, method, requestMessage, options = { }) {
    const addressProvider = this.createDAPIAddressProviderFromOptions(options)
      || this.addressProvider;

    const address = await addressProvider.getLiveAddress();

    this.lastUsedAddress = address;

    // eslint-disable-next-line no-param-reassign
    options = {
      retries: this.globalOptions.retries,
      timeout: this.globalOptions.timeout,
      ...options,
    };

    const url = this.makeGrpcUrlFromAddress(address);
    const client = new ClientClass(url);

    try {
      const result = await client[method](requestMessage);

      address.markAsLive();

      return result;
    } catch (error) {
      if (error.code !== GrpcErrorCodes.DEADLINE_EXCEEDED
        && error.code !== GrpcErrorCodes.UNAVAILABLE
        && error.code !== GrpcErrorCodes.INTERNAL
        && error.code !== GrpcErrorCodes.CANCELLED) {
        throw error;
      }

      address.markAsBanned();

      if (options.retries === 0) {
        throw new MaxRetriesReachedError(error);
      }

      const hasAddresses = await addressProvider.hasLiveAddresses();
      if (!hasAddresses) {
        throw new NoAvailableAddressesForRetry(error);
      }

      return this.request(
        ClientClass,
        method,
        requestMessage,
        {
          ...options,
          retries: options.retries - 1,
        },
      );
    }
  }

  /**
   * Get last used address
   *
   * @return {DAPIAddress|null}
   */
  getLastUsedAddress() {
    return this.lastUsedAddress;
  }

  /**
   *
   * Get gRPC url string
   *
   * @private
   * @param {DAPIAddress} address
   * @returns {string}
   */
  makeGrpcUrlFromAddress(address) {
    // For NodeJS Client
    if (typeof process !== 'undefined'
      && process.versions != null
      && process.versions.node != null) {
      return `${address.getHost()}:${address.getGrpcPort()}`;
    }

    // For gRPC-Web client
    const protocol = this.httpPort === 443 ? 'https' : 'http';

    return `${protocol}://${address.getHost()}:${address.getHttpPort()}`;
  }
}

module.exports = GrpcTransport;
