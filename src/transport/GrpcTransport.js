const {
  CorePromiseClient,
  PlatformPromiseClient,
  TransactionsFilterStreamPromiseClient,
} = require('@dashevo/dapi-grpc');

// eslint-disable-next-line import/no-extraneous-dependencies
const { CODES: grpcErrorCodes } = require('@dashevo/grpc-common/lib/server/error/GrpcError');

class GrpcTransport {
  /**
   * @param {MNDiscovery} mnDiscovery
   * @param {number} dapiPort
   * @param {number} grpcNativePort
   * @param {string} clientType
   */
  constructor(mnDiscovery, dapiPort, grpcNativePort, clientType) {
    this.mnDiscovery = mnDiscovery;
    this.dapiPort = dapiPort;
    this.grpcNativePort = grpcNativePort;
    this.clientType = clientType;
  }

  /**
   * Make request to a random MN (with retries)
   *
   * @param {string} method
   * @param {Object} request
   * @param {Object} options
   * @param {number} [options.retriesCount=3]
   * @param {string[]} [options.excludedIps=[]]
   * @param {Object} [options.client={}]
   * @param {number} [options.client.timeout]
   *
   * @returns {Promise<*|undefined>}
   */
  async makeRequest(method, request, options = { retriesCount: 3, excludedIps: [] }) {
    const retriesCount = options.retriesCount || 3;
    const excludedIps = options.excludedIps || [];

    let urlToConnect;
    try {
      urlToConnect = await this.getGrpcUrl(excludedIps);

      let client;
      switch (this.clientType) {
        case GrpcTransport.TYPES.CORE: {
          client = new CorePromiseClient(urlToConnect);
          break;
        }
        case GrpcTransport.TYPES.PLATFORM: {
          client = new PlatformPromiseClient(urlToConnect);
          break;
        }
        case GrpcTransport.TYPES.TX: {
          client = new TransactionsFilterStreamPromiseClient(urlToConnect);
          break;
        }
        default: {
          throw new Error('Unknown gRPC client type selected');
        }
      }

      return client[method](request);
    } catch (e) {
      if (e.code !== grpcErrorCodes.DEADLINE_EXCEEDED && e.code !== grpcErrorCodes.UNAVAILABLE) {
        throw e;
      }

      if (retriesCount > 0) {
        const currentMasternodeIp = urlToConnect.split(':')[0];

        return this.makeRequest(
          method, request, {
            ...options,
            retriesCount: retriesCount - 1,
            excludedIps: [currentMasternodeIp, ...excludedIps],
          },
        );
      }

      throw e;
    }
  }

  /**
   * @private
   *
   * Get gRPC url string
   *
   * @param {string[]} [excludedIps]
   *
   * @returns {Promise<string>}
   */
  async getGrpcUrl(excludedIps = []) {
    const randomMasternode = await this.mnDiscovery.getRandomMasternode(excludedIps);

    if (typeof process !== 'undefined'
      && process.versions != null
      && process.versions.node != null) {
      return `${randomMasternode.getIp()}:${this.grpcNativePort}`;
    }

    return `http://${randomMasternode.getIp()}:${this.dapiPort}`;
  }
}

GrpcTransport.TYPES = {
  CORE: 'core',
  PLATFORM: 'platform',
  TX: 'txFilterStream',
};

module.exports = GrpcTransport;
