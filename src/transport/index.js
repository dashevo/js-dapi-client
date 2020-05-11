const JsonRpcTransport = require('./JsonRpcTransport');
const GrpcTransport = require('./GrpcTransport');

class Transport {
  /**
   * @param {MNDiscovery} mnDiscovery
   * @param {number} dapiPort
   * @param {number} grpcNativePort
   */
  constructor(mnDiscovery, dapiPort, grpcNativePort) {
    this.transports = {
      [Transport.JSON_RPC]: new JsonRpcTransport(
        mnDiscovery, dapiPort,
      ),
      [Transport.GRPC_CORE]: new GrpcTransport(
        mnDiscovery, dapiPort, grpcNativePort, GrpcTransport.TYPES.CORE,
      ),
      [Transport.GRPC_PLATFORM]: new GrpcTransport(
        mnDiscovery, dapiPort, grpcNativePort, GrpcTransport.TYPES.PLATFORM,
      ),
      [Transport.GRPC_TX]: new GrpcTransport(
        mnDiscovery, dapiPort, grpcNativePort, GrpcTransport.TYPES.TX,
      ),
    };
  }

  /**
   * Get appropriate transport for a request
   *
   * @param {string} transport - transport type
   *
   * @returns {JsonRpcTransport|GrpcTransport}
   */
  get(transport) {
    if (!this.transports[transport]) {
      throw new Error('Unknown transport selected');
    }

    return this.transports[transport];
  }
}

Transport.JSON_RPC = 'jsonRPC';
Transport.GRPC_CORE = 'grpcCore';
Transport.GRPC_PLATFORM = 'grpcPlatform';
Transport.GRPC_TX = 'grpcTxFilterStream';

module.exports = Transport;
