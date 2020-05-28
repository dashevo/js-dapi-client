const GrpcTransport = require('./transport/GrpcTransport');
const JsonRpcTransport = require('./transport/JsonRpcTransport/JsonRpcTransport');

const CoreMethodsFacade = require('./methods/core/CoreMethodsFacade');
const PlatformMethodsFacade = require('./methods/platform/PlatformMethodsFacade');

const createDAPIAddressProviderFromOptions = require('./addressProvider/createDAPIAddressProviderFromOptions');
const requestJsonRpc = require('./transport/JsonRpcTransport/requestJsonRpc');

class DAPIClient {
  /**
   * @param {DAPIClientOptions} options
   */
  constructor(options) {
    this.options = Object.assign(options, {
      timeout: 2000,
      retries: 3,
    });

    this.addressProvider = createDAPIAddressProviderFromOptions(options);
    if (!this.addressProvider) {
      // Connect to evonet if no address options passed
      this.addressProvider = createDAPIAddressProviderFromOptions({ network: 'evonet' });
    }

    const grpcTransport = new GrpcTransport(
      createDAPIAddressProviderFromOptions,
      this.addressProvider,
      options,
    );

    const jsonRpcTransport = new JsonRpcTransport(
      createDAPIAddressProviderFromOptions,
      requestJsonRpc,
      this.addressProvider,
      options,
    );

    this.core = new CoreMethodsFacade(jsonRpcTransport, grpcTransport);
    this.platform = new PlatformMethodsFacade(grpcTransport);
  }
}

/**
 * @typedef {DAPIClientOptions} DAPIClientOptions
 * @property {DAPIAddressProvider} [addressProvider]
 * @property {RawDAPIAddress|DAPIAddress|string} [address]
 * @property {string[]|RawDAPIAddress[]} [seeds]
 * @property {string} [network=evonet]
 * @property {number} [timeout=2000]
 * @property {number} [retries=3]
 * @property {number} [baseBanTime=60000]
 */

module.exports = DAPIClient;