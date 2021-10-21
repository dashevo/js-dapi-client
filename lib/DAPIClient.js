const GrpcTransport = require('./transport/GrpcTransport/GrpcTransport');
const JsonRpcTransport = require('./transport/JsonRpcTransport/JsonRpcTransport');

const CoreMethodsFacade = require('./methods/core/CoreMethodsFacade');
const PlatformMethodsFacade = require('./methods/platform/PlatformMethodsFacade');

const createDAPIAddressProviderFromOptions = require('./dapiAddressProvider/createDAPIAddressProviderFromOptions');
const requestJsonRpc = require('./transport/JsonRpcTransport/requestJsonRpc');
const createGrpcTransportError = require('./transport/GrpcTransport/createGrpcTransportError');
const createJsonTransportError = require('./transport/JsonRpcTransport/createJsonTransportError');

class DAPIClient {
  /**
   * @param {DAPIClientOptions} [options]
   */
  constructor(options = {}) {
    this.options = {
      network: 'testnet',
      timeout: 10000,
      retries: 5,
      ...options,
    };

    this.dapiAddressProvider = createDAPIAddressProviderFromOptions(this.options);

    const grpcTransport = new GrpcTransport(
      createDAPIAddressProviderFromOptions,
      this.dapiAddressProvider,
      createGrpcTransportError,
      this.options,
    );

    const jsonRpcTransport = new JsonRpcTransport(
      createDAPIAddressProviderFromOptions,
      requestJsonRpc,
      this.dapiAddressProvider,
      createJsonTransportError,
      this.options,
    );

    this.core = new CoreMethodsFacade(jsonRpcTransport, grpcTransport);
    this.platform = new PlatformMethodsFacade(grpcTransport);
  }
}

/**
 * @typedef {DAPIClientOptions} DAPIClientOptions
 * @property {DAPIAddressProvider} [dapiAddressProvider]
 * @property {Array<RawDAPIAddress|DAPIAddress|string>} [dapiAddresses]
 * @property {Array<RawDAPIAddress|DAPIAddress|string>} [seeds]
 * @property {Array<RawDAPIAddress|DAPIAddress|string>} [dapiAddressesWhiteList]
 * @property {string|Network} [network=testnet]
 * @property {number} [timeout=2000]
 * @property {number} [retries=3]
 * @property {number} [baseBanTime=60000]
 * @property {boolean} [throwDeadlineExceeded]
 */

module.exports = DAPIClient;
