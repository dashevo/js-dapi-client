const MaxRetriesReachedError = require('../errors/MaxRetriesReachedError');
const NoAvailableAddressesForRetry = require('../errors/NoAvailableAddressesForRetry');

class JsonRpcTransport {
  /**
   * @param {createDAPIAddressProviderFromOptions} createDAPIAddressProviderFromOptions
   * @param {requestJsonRpc} requestJsonRpc
   * @param {ListDAPIAddressProvider|DMLAddressProvider|DAPIAddressProvider} addressProvider
   * @param {DAPIClientOptions} globalOptions
   */
  constructor(
    createDAPIAddressProviderFromOptions,
    requestJsonRpc,
    addressProvider,
    globalOptions,
  ) {
    this.createDAPIAddressProviderFromOptions = createDAPIAddressProviderFromOptions;
    this.requestJsonRpc = requestJsonRpc;
    this.addressProvider = addressProvider;
    this.globalOptions = globalOptions;

    this.lastUsedAddress = null;
  }

  /**
   * Make request to DAPI node
   *
   * @param {string} method
   * @param {Object} [params]
   * @param {DAPIClientOptions} [options]
   *
   * @returns {Promise<Object>}
   */
  async request(method, params = {}, options = { }) {
    const addressProvider = this.createDAPIAddressProviderFromOptions(options)
      || this.addressProvider;

    const address = await addressProvider.getAddress();

    this.lastUsedAddress = address;

    Object.assign(options, {
      retries: this.globalOptions.retries,
      timeout: this.globalOptions.timeout,
    });

    try {
      const result = await this.requestJsonRpc(
        address.getHost(),
        address.getHttpPort(),
        method,
        params,
        { timeout: options.timeout },
      );

      address.markAsLive();

      return result;
    } catch (error) {
      if (error.code !== 'ECONNABORTED' && error.code !== 'ECONNREFUSED') {
        throw error;
      }

      address.markAsBanned();

      if (options.retries === 0) {
        throw new MaxRetriesReachedError(error);
      }

      const newAddress = await addressProvider.getAddress();
      if (!newAddress) {
        throw new NoAvailableAddressesForRetry(error);
      }

      return this.request(
        method,
        params,
        {
          ...options,
          address: newAddress,
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
}

module.exports = JsonRpcTransport;
