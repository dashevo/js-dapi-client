const DAPIAddress = require('./DAPIAddress');

const ListAddressProvider = require('./ListAddressProvider');

const SMLProvider = require('../SMLProvider/SMLProvider');
const SMLAddressProvider = require('./SMLAddressProvider');

const JsonRpcTransport = require('../transport/JsonRpcTransport/JsonRpcTransport');
const requestJsonRpc = require('../transport/JsonRpcTransport/requestJsonRpc');

const DAPIClientError = require('../errors/DAPIClientError');

const networks = require('../networkConfigs');

/**
 * @typedef {createAddressProviderFromOptions}
 * @param {DAPIClientOptions} options
 * @returns {AddressProvider|ListAddressProvider|SMLAddressProvider|null}
 */
function createAddressProviderFromOptions(options) {
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

    return new ListAddressProvider([
      new DAPIAddress(options.address),
      options,
    ]);
  }

  if (options.seeds) {
    if (options.network) {
      throw new DAPIClientError("Can't use 'network' with 'seeds' option");
    }

    const listAddressProvider = new ListAddressProvider(
      options.seeds.map((rawAddress) => new DAPIAddress(rawAddress)),
      options,
    );

    const jsonRpcTransport = new JsonRpcTransport(
      createAddressProviderFromOptions,
      requestJsonRpc,
      listAddressProvider,
      options,
    );

    const dmlProvider = new SMLProvider(
      jsonRpcTransport,
      { networkType: options.networkType },
    );

    return new SMLAddressProvider(dmlProvider, listAddressProvider);
  }

  if (options.network) {
    if (!networks[options.network]) {
      throw new DAPIClientError(`Invalid network '${options.network}'`);
    }

    const networkConfig = { ...options, ...networks[options.network] };
    // noinspection JSUnresolvedVariable
    delete networkConfig.network;

    return createAddressProviderFromOptions(networkConfig);
  }

  return null;
}

module.exports = createAddressProviderFromOptions;
