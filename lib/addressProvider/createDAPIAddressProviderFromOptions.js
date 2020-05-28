const DAPIAddress = require('./DAPIAddress');

const ListDAPIAddressProvider = require('./ListDAPIAddressProvider');

const DMLProvider = require('./DMLAddressProvder/DMLProvider');
const DMLAddressProvider = require('./DMLAddressProvder/DMLAddressProvider');

const JsonRpcTransport = require('../transport/JsonRpcTransport/JsonRpcTransport');
const requestJsonRpc = require('../transport/JsonRpcTransport/requestJsonRpc');

const DAPIClientError = require('../errors/DAPIClientError');

const networks = require('../networkConfigs');

/**
 * @typedef {createDAPIAddressProviderFromOptions}
 * @param {DAPIClientOptions} options
 * @returns {DAPIAddressProvider|ListDAPIAddressProvider|DMLAddressProvider|null}
 */
function createDAPIAddressProviderFromOptions(options) {
  if (options.addressProvider) {
    if (options.address) {
      throw new DAPIClientError("Can't use 'address' with 'addressProvider' option");
    }

    if (options.seeds) {
      throw new DAPIClientError("Can't use 'seeds' with 'addressProvider' option");
    }

    if (options.network) {
      throw new DAPIClientError("Can't use 'network' with 'addressProvider' option");
    }

    return options.addressProvider;
  }

  // TODO: Make it as a list
  if (options.address) {
    if (options.seeds) {
      throw new DAPIClientError("Can't use 'seeds' with 'address' option");
    }

    if (options.network) {
      throw new DAPIClientError("Can't use 'network' with 'address' option");
    }

    return new ListDAPIAddressProvider([
      new DAPIAddress(options.address),
      options,
    ]);
  }

  if (options.seeds) {
    if (options.network) {
      throw new DAPIClientError("Can't use 'network' with 'seeds' option");
    }

    const addressProvider = new ListDAPIAddressProvider(
      options.seeds.map((rawAddress) => new DAPIAddress(rawAddress)),
      options,
    );

    const jsonRpcTransport = new JsonRpcTransport(
      createDAPIAddressProviderFromOptions,
      requestJsonRpc,
      addressProvider,
      options,
    );

    const dmlProvider = new DMLProvider(jsonRpcTransport, addressProvider);

    return new DMLAddressProvider(dmlProvider, addressProvider);
  }

  if (options.network) {
    if (!networks[options.network]) {
      throw new DAPIClientError(`Invalid network '${options.network}'`);
    }

    const networkConfig = { ...options, ...networks[options.network] };
    // noinspection JSUnresolvedVariable
    delete networkConfig.network;

    return createDAPIAddressProviderFromOptions(networkConfig);
  }

  return null;
}

module.exports = createDAPIAddressProviderFromOptions;
