const {
  v0: {
    PlatformPromiseClient,
    GetIdentityIdsByPublicKeyHashesRequest,
  },
} = require('@dashevo/dapi-grpc');

const grpcErrorCodes = require('@dashevo/grpc-common/lib/server/error/GrpcErrorCodes');

/**
 * @param {GrpcTransport} grpcTransport
 * @returns {getIdentityIdsByPublicKeyHashes}
 */
function getIdentityIdsByPublicKeyHashesFactory(grpcTransport) {
  /**
   * Fetch the identities by public key hashes
   *
   * @typedef {getIdentityIdsByPublicKeyHashes}
   * @param {string[]} publicKeyHashes
   * @param {DAPIClientOptions} [options]
   * @returns {Promise<!Object.<string, string>>}
   */
  async function getIdentityIdsByPublicKeyHashes(publicKeyHashes, options = {}) {
    const getIdentityIdsByPublicKeyHashesRequest = new GetIdentityIdsByPublicKeyHashesRequest();
    getIdentityIdsByPublicKeyHashesRequest.setPublicKeyHashes(
      publicKeyHashes.map((publicKeyHash) => Buffer.from(publicKeyHash, 'hex')),
    );

    let getIdentityIdsByPublicKeyHashesResponse;
    try {
      getIdentityIdsByPublicKeyHashesResponse = await grpcTransport.request(
        PlatformPromiseClient,
        'getIdentityIdsByPublicKeyHashes',
        getIdentityIdsByPublicKeyHashesRequest,
        options,
      );
    } catch (e) {
      if (e.code === grpcErrorCodes.NOT_FOUND) {
        return null;
      }

      throw e;
    }

    return getIdentityIdsByPublicKeyHashesResponse.getPublicKeyHashIdentityIdMap();
  }

  return getIdentityIdsByPublicKeyHashes;
}

module.exports = getIdentityIdsByPublicKeyHashesFactory;
