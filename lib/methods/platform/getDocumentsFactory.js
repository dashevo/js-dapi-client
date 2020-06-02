const cbor = require('cbor');

const {
  PlatformPromiseClient,
  GetDocumentsRequest,
} = require('@dashevo/dapi-grpc');

/**
 * @param {GrpcTransport} grpcTransport
 * @returns {getDocuments}
 */
function getDocumentsFactory(grpcTransport) {
  /**
   * Fetch Documents from Drive
   *
   * @typedef {getDocuments}
   * @param {string} contractId
   * @param {string} type - Dap objects type to fetch
   * @param {DAPIClientOptions} [options]
   * @returns {Promise<Buffer[]>}
   */
  async function getDocuments(contractId, type, options) {
    const {
      where,
      orderBy,
      limit,
      startAt,
      startAfter,
    } = options;

    let whereSerialized;
    if (where) {
      whereSerialized = cbor.encode(where);
    }

    let orderBySerialized;
    if (orderBy) {
      orderBySerialized = cbor.encode(orderBy);
    }

    const getDocumentsRequest = new GetDocumentsRequest();
    getDocumentsRequest.setDataContractId(contractId);
    getDocumentsRequest.setDocumentType(type);
    getDocumentsRequest.setWhere(whereSerialized);
    getDocumentsRequest.setOrderBy(orderBySerialized);
    getDocumentsRequest.setLimit(limit);
    getDocumentsRequest.setStartAfter(startAfter);
    getDocumentsRequest.setStartAt(startAt);

    const getDocumentsResponse = await grpcTransport.request(
      PlatformPromiseClient,
      'getDocuments',
      getDocumentsRequest,
      options,
    );

    return getDocumentsResponse.getDocumentsList()
      .map((document) => Buffer.from(document));
  }

  return getDocuments;
}

module.exports = getDocumentsFactory;
