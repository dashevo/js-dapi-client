const {
  v0: {
    PlatformPromiseClient,
    GetIdentityIdByFirstPublicKeyRequest,
  },
} = require('@dashevo/dapi-grpc');

const grpcErrorCodes = require('@dashevo/grpc-common/lib/server/error/GrpcErrorCodes');

/**
 * @param {GrpcTransport} grpcTransport
 * @returns {getIdentityIdByPublicKeyHash}
 */
function getIdentityIdByPublicKeyHashFactory(grpcTransport) {
  /**
   * Fetch the identity id by public key hash
   *
   * @typedef {getIdentityIdByPublicKeyHash}
   * @param {string} publicKeyHash
   * @param {DAPIClientOptions} [options]
   * @returns {Promise<!string|null>}
   */
  async function getIdentityIdByPublicKeyHash(publicKeyHash, options = {}) {
    const getIdentityIdByPublicKeyHashRequest = new GetIdentityIdByFirstPublicKeyRequest();
    getIdentityIdByPublicKeyHashRequest.setPublicKeyHash(Buffer.from(publicKeyHash, 'hex'));

    let getIdentityIdByPublicKeyHashResponse;
    try {
      getIdentityIdByPublicKeyHashResponse = await grpcTransport.request(
        PlatformPromiseClient,
        'getIdentityIdByPublicKeyHash',
        getIdentityIdByPublicKeyHashRequest,
        options,
      );
    } catch (e) {
      if (e.code === grpcErrorCodes.NOT_FOUND) {
        return null;
      }

      throw e;
    }

    return getIdentityIdByPublicKeyHashResponse.getId();
  }

  return getIdentityIdByPublicKeyHash;
}

module.exports = getIdentityIdByPublicKeyHashFactory;
