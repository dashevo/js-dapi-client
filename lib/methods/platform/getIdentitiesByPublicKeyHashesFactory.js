const {
  v0: {
    PlatformPromiseClient,
    GetIdentitiesByPublicKeyHashesRequest,
  },
} = require('@dashevo/dapi-grpc');

const grpcErrorCodes = require('@dashevo/grpc-common/lib/server/error/GrpcErrorCodes');

/**
 * @param {GrpcTransport} grpcTransport
 * @returns {getIdentitiesByPublicKeyHashes}
 */
function getIdentitiesByPublicKeyHashesFactory(grpcTransport) {
  /**
   * Fetch the identities by public key hashes
   *
   * @typedef {getIdentitiesByPublicKeyHashes}
   * @param {string[]} publicKeyHashes
   * @param {DAPIClientOptions} [options]
   * @returns {Promise<!Buffer[]>}
   */
  async function getIdentitiesByPublicKeyHashes(publicKeyHashes, options = {}) {
    const getIdentitiesByPublicKeyHashesRequest = new GetIdentitiesByPublicKeyHashesRequest();
    getIdentitiesByPublicKeyHashesRequest.setPublicKeyHashes(
      publicKeyHashes.map((publicKeyHash) => Buffer.from(publicKeyHash, 'hex')),
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
        return null;
      }

      throw e;
    }

    const serializedIdentities = getIdentitiesByPublicKeyHashesResponse.getIdentities();

    return serializedIdentities.map(
      (serializedIdentity) => Buffer.from(serializedIdentity),
    );
  }

  return getIdentitiesByPublicKeyHashes;
}

module.exports = getIdentitiesByPublicKeyHashesFactory;
