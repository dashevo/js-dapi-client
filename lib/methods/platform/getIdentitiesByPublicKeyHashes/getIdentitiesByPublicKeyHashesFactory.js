const {
  v0: {
    PlatformPromiseClient,
    GetIdentitiesByPublicKeyHashesRequest,
  },
} = require('@dashevo/dapi-grpc');

const grpcErrorCodes = require('@dashevo/grpc-common/lib/server/error/GrpcErrorCodes');
const GetIdentitiesByPublicKeyHashesResponse = require('./GetIdentitiesByPublicKeyHashesResponse');

/**
 * @param {GrpcTransport} grpcTransport
 * @returns {getIdentitiesByPublicKeyHashes}
 */
function getIdentitiesByPublicKeyHashesFactory(grpcTransport) {
  /**
   * Fetch the identities by public key hashes
   *
   * @typedef {getIdentitiesByPublicKeyHashes}
   * @param {Buffer[]} publicKeyHashes
   * @param {DAPIClientOptions} [options]
   * @returns {Promise<GetIdentitiesByPublicKeyHashesResponse>}
   */
  async function getIdentitiesByPublicKeyHashes(publicKeyHashes, options = {}) {
    const getIdentitiesByPublicKeyHashesRequest = new GetIdentitiesByPublicKeyHashesRequest();
    getIdentitiesByPublicKeyHashesRequest.setPublicKeyHashesList(
      publicKeyHashes,
    );

    let getIdentitiesByPublicKeyHashesResponse;
    try {
      getIdentitiesByPublicKeyHashesResponse = await grpcTransport.request(
        PlatformPromiseClient,
        'getIdentitiesByPublicKeyHashes',
        getIdentitiesByPublicKeyHashesRequest,
        options,
      );
    } catch (e) {
      if (e.code === grpcErrorCodes.NOT_FOUND) {
        return new GetIdentitiesByPublicKeyHashesResponse(undefined, null);
      }

      throw e;
    }

    return GetIdentitiesByPublicKeyHashesResponse
      .createFromProto(getIdentitiesByPublicKeyHashesResponse);
  }

  return getIdentitiesByPublicKeyHashes;
}

module.exports = getIdentitiesByPublicKeyHashesFactory;
