const JsonRpcTransport = require('./JsonRpcTransport');
const GrpcTransport = require('./GrpcTransport');

class TransportManager {
  /**
   * @param {MNDiscovery} mnDiscovery
   * @param {number} dapiPort
   * @param {number} grpcNativePort
   */
  constructor(mnDiscovery, dapiPort, grpcNativePort) {
    this.transports = {
      [TransportManager.JSON_RPC]: new JsonRpcTransport(
        mnDiscovery, dapiPort,
      ),
      [TransportManager.GRPC_CORE]: new GrpcTransport(
        mnDiscovery, dapiPort, grpcNativePort, GrpcTransport.TYPES.CORE,
      ),
      [TransportManager.GRPC_PLATFORM]: new GrpcTransport(
        mnDiscovery, dapiPort, grpcNativePort, GrpcTransport.TYPES.PLATFORM,
      ),
      [TransportManager.GRPC_TX]: new GrpcTransport(
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

TransportManager.JSON_RPC = 'jsonRPC';
TransportManager.GRPC_CORE = 'grpcCore';
TransportManager.GRPC_PLATFORM = 'grpcPlatform';
TransportManager.GRPC_TX = 'grpcTxFilterStream';

module.exports = TransportManager;
