const MaxRetriesReachedError = require('../errors/MaxRetriesReachedError');
const NoAvailableAddressesForRetry = require('../errors/NoAvailableAddressesForRetry');

class JsonRpcTransport {
  /**
   * @param {createAddressProviderFromOptions} createAddressProviderFromOptions
   * @param {requestJsonRpc} requestJsonRpc
   * @param {ListAddressProvider|SMLAddressProvider|AddressProvider} addressProvider
   * @param {DAPIClientOptions} globalOptions
   */
  constructor(
    createAddressProviderFromOptions,
    requestJsonRpc,
    addressProvider,
    globalOptions,
  ) {
    this.createAddressProviderFromOptions = createAddressProviderFromOptions;
    this.requestJsonRpc = requestJsonRpc;
    this.addressProvider = addressProvider;
    this.globalOptions = globalOptions;

    this.lastUsedAddress = null;
  }

  /**
   * Make request to DAPI node
   *
   * @param {string} method
   * @param {object} [params]
   * @param {DAPIClientOptions} [options]
   *
   * @returns {Promise<object>}
   */
  async request(method, params = {}, options = { }) {
    const addressProvider = this.createAddressProviderFromOptions(options)
      || this.addressProvider;

    const address = await addressProvider.getLiveAddress();

    this.lastUsedAddress = address;

    // eslint-disable-next-line no-param-reassign
    options = {
      retries: this.globalOptions.retries,
      timeout: this.globalOptions.timeout,
      ...options,
    };

    const requestOptions = {};
    if (options.timeout !== undefined) {
      requestOptions.timeout = options.timeout;
    }

    try {
      const result = await this.requestJsonRpc(
        address.getHost(),
        address.getHttpPort(),
        method,
        params,
        requestOptions,
      );

      address.markAsLive();

      return result;
    } catch (error) {
      if (error.code !== 'ECONNABORTED' && error.code !== 'ECONNREFUSED'
        && error.code !== -32603 && !(error.code >= -32000 && error.code <= -32099)) {
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
        method,
        params,
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
   * @returns {DAPIAddress|null}
   */
  getLastUsedAddress() {
    return this.lastUsedAddress;
  }
}

module.exports = JsonRpcTransport;
