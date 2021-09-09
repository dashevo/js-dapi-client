const GrpcErrorCodes = require('@dashevo/grpc-common/lib/server/error/GrpcErrorCodes');

const MaxRetriesReachedError = require('./errors/MaxRetriesReachedError');
const NoAvailableAddressesForRetryError = require('./errors/NoAvailableAddressesForRetryError');
const NoAvailableAddressesError = require('./errors/NoAvailableAddressesError');
const ResponseError = require('./errors/response/ResponseError');
const NotFoundError = require('./errors/response/NotFoundError');

class GrpcTransport {
  /**
   * @param {createDAPIAddressProviderFromOptions} createDAPIAddressProviderFromOptions
   * @param {
   *    ListDAPIAddressProvider|
   *    SimplifiedMasternodeListDAPIAddressProvider|
   *    DAPIAddressProvider
   * } dapiAddressProvider
   * @param {DAPIClientOptions} globalOptions
   */
  constructor(createDAPIAddressProviderFromOptions, dapiAddressProvider, globalOptions) {
    this.createDAPIAddressProviderFromOptions = createDAPIAddressProviderFromOptions;
    this.dapiAddressProvider = dapiAddressProvider;
    this.globalOptions = globalOptions;

    this.lastUsedAddress = null;
  }

  /**
   * Make request to DAPI node
   *
   * @param {Function} ClientClass
   * @param {string} method
   * @param {object} requestMessage
   * @param {DAPIClientOptions} [options]
   *
   * @returns {Promise<object>}
   */
  async request(ClientClass, method, requestMessage, options = { }) {
    const dapiAddressProvider = this.createDAPIAddressProviderFromOptions(options)
      || this.dapiAddressProvider;

    const address = await dapiAddressProvider.getLiveAddress();

    if (!address) {
      throw new NoAvailableAddressesError();
    }

    // eslint-disable-next-line no-param-reassign
    options = {
      retries: this.globalOptions.retries,
      timeout: this.globalOptions.timeout,
      ...options,
    };

    const url = this.makeGrpcUrlFromAddress(address);
    const client = new ClientClass(url);

    const requestOptions = {};
    if (options.timeout !== undefined) {
      requestOptions.deadline = new Date();
      requestOptions.deadline.setMilliseconds(
        requestOptions.deadline.getMilliseconds() + options.timeout,
      );
    }

    try {
      const result = await client[method](requestMessage, {}, requestOptions);

      this.lastUsedAddress = address;

      address.markAsLive();

      return result;
    } catch (error) {
      this.lastUsedAddress = address;

      // Client-side JS error
      if (error.code === undefined) {
        throw error;
      }

      const data = decodeMetadata(error.metadata);

      const serverError = createDAPIServerError(error.code, error.message, data);

      const clientError = createDAPIClientError(serverError);

      if (!(clientError instanceof RetriableResponseError)) {
        throw clientError;
      }

      if (options.throwDeadlineExceeded && clientError instanceof TimeoutError) {
        throw clientError;
      }

      if (options.retries === 0) {
        throw new MaxRetriesReachedError(clientError);
      }

      const hasAddresses = await dapiAddressProvider.hasLiveAddresses();
      if (!hasAddresses) {
        throw new NoAvailableAddressesForRetryError(clientError);
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
   * @returns {DAPIAddress|null}
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
    let port = address.getHttpPort();

    // For NodeJS Client
    if (typeof process !== 'undefined'
      && process.versions != null
      && process.versions.node != null) {
      port = address.getGrpcPort();
    }

    const protocol = address.getHttpPort() === 443 ? 'https' : 'http';

    return `${protocol}://${address.getHost()}:${port}`;
  }
}

module.exports = GrpcTransport;
