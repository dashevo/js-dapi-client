const GrpcTransport = require('./transport/GrpcTransport');
const JsonRpcTransport = require('./transport/JsonRpcTransport/JsonRpcTransport');

const CoreMethodsFacade = require('./methods/core/CoreMethodsFacade');
const PlatformMethodsFacade = require('./methods/platform/PlatformMethodsFacade');

const createAddressProviderFromOptions = require('./addressProvider/createAddressProviderFromOptions');
const requestJsonRpc = require('./transport/JsonRpcTransport/requestJsonRpc');

class DAPIClient {
  /**
   * @param {DAPIClientOptions} options
   */
  constructor(options) {
    this.options = {
      timeout: 2000,
      retries: 3,
      ...options,
    };

    this.addressProvider = createAddressProviderFromOptions(this.options);
    if (!this.addressProvider) {
      // Connect to evonet if no address options passed
      this.addressProvider = createAddressProviderFromOptions({ network: 'evonet' });
    }

    const grpcTransport = new GrpcTransport(
      createAddressProviderFromOptions,
      this.addressProvider,
      this.options,
    );

    const jsonRpcTransport = new JsonRpcTransport(
      createAddressProviderFromOptions,
      requestJsonRpc,
      this.addressProvider,
      this.options,
    );

    this.core = new CoreMethodsFacade(jsonRpcTransport, grpcTransport);
    this.platform = new PlatformMethodsFacade(grpcTransport);
  }
}

/**
 * @typedef {DAPIClientOptions} DAPIClientOptions
 * @property {AddressProvider} [addressProvider]
 * @property {RawDAPIAddress|DAPIAddress|string} [address]
 * @property {string[]|RawDAPIAddress[]} [seeds]
 * @property {string} [network=evonet]
 * @property {number} [timeout=2000]
 * @property {number} [retries=3]
 * @property {number} [baseBanTime=60000]
 */

module.exports = DAPIClient;
