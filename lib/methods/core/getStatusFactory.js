const {
  v0: {
    GetStatusRequest,
    GetStatusResponse,
    CorePromiseClient,
  },
} = require('@dashevo/dapi-grpc');

/**
 * @param {GrpcTransport} grpcTransport
 * @returns {getStatus}
 */
function getStatusFactory(grpcTransport) {
  /**
   * Get Core chain status
   *
   * @typedef {getStatus}
   * @param {DAPIClientOptions} [options]
   * @returns {Promise<object>}
   */
  async function getStatus(options = {}) {
    const getStatusRequest = new GetStatusRequest();

    const response = await grpcTransport.request(
      CorePromiseClient,
      'getStatus',
      getStatusRequest,
      options,
    );

    let version;
    if (response.getVersion()) {
      version = {
        protocol: response.getVersion().getProtocol(),
        software: response.getVersion().getSoftware(),
        agent: response.getVersion().getAgent(),
      };
    }

    let time;
    if (response.getTime()) {
      time = {
        now: response.getTime().getNow(),
        offset: response.getTime().getOffset(),
        median: response.getTime().getMedian(),
      };
    }

    let chain;
    if (response.getChain()) {
      chain = {
        name: response.getChain().getName(),
        headersCount: response.getChain().getHeadersCount(),
        blocksCount: response.getChain().getBlocksCount(),
        bestBlockHash: response.getChain().getBestBlockHash(),
        difficulty: response.getChain().getDifficulty(),
        chainWork: response.getChain().getChainWork(),
        isSynced: response.getChain().getIsSynced(),
        syncProgress: response.getChain().getSyncProgress(),
      };
    }

    let masternode;
    if (response.getMasternode()) {
      masternode = {
        status: response.getMasternode().getStatus(),
        proTxHash: response.getMasternode().getProTxHash(),
        posePenalty: response.getMasternode().getPosePenalty(),
        isSynced: response.getMasternode().getIsSynced(),
        syncProgress: response.getMasternode().getSyncProgress(),
      };
    }

    let network;
    if (response.getNetwork()) {
      let fee;
      if (response.getNetwork().getFee()) {
        fee = {
          relay: response.getNetwork().getFee().getRelay(),
          incremental: response.getNetwork().getFee().getRelay(),
        };
      }

      network = {
        peersCount: response.getNetwork().getPeersCount(),
        fee,
      };
    }

    const responseObject = {
      version,
      time,
      status: response.getStatus(),
      syncProgress: response.getSyncProgress(),
      chain,
      masternode,
      network,
    };

    responseObject.status = Object.keys(GetStatusResponse.Status)
      .find((key) => GetStatusResponse.Status[key] === responseObject.status);

    if (responseObject.masternode) {
      responseObject.masternode.status = Object.keys(GetStatusResponse.Masternode.Status)
        .find((key) => (
          GetStatusResponse.Masternode.Status[key] === responseObject.masternode.status
        ));
    }

    return responseObject;
  }

  return getStatus;
}

module.exports = getStatusFactory;
