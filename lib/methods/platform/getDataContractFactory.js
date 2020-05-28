const {
  PlatformPromiseClient,
  GetDataContractRequest,
} = require('@dashevo/dapi-grpc');

const grpcErrorCodes = require('@dashevo/grpc-common/lib/server/error/GrpcErrorCodes')

/**
 * @param {GrpcTransport} grpcTransport
 * @return {getDataContract}
 */
function getDataContractFactory(grpcTransport) {
  /**
   * Fetch Data Contract by id
   *
   * @typedef {getDataContract}
   * @param {string} contractId
   * @param {DAPIClientOptions} [options]
   * @returns {Promise<Buffer>}
   */
  async function getDataContract(contractId, options = {}) {
    const getDataContractRequest = new GetDataContractRequest();

    getDataContractRequest.setId(contractId);

    let getDataContractResponse;
    try {
      getDataContractResponse = grpcTransport.request(
        PlatformPromiseClient,
        'getDataContract',
        getDataContractRequest,
        options,
      );
    } catch (e) {
      if (e.code === grpcErrorCodes.NOT_FOUND) {
        return null;
      }

      throw e;
    }

    const serializedDataContractBinaryArray = getDataContractResponse.getDataContract();

    let dataContract = null;

    if (serializedDataContractBinaryArray) {
      dataContract = Buffer.from(serializedDataContractBinaryArray);
    }

    return dataContract;
  }

  return getDataContract;
}

module.exports = getDataContractFactory;