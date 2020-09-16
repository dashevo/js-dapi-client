const {
  v0: {
    PlatformPromiseClient,
    GetIdentityByFirstPublicKeyRequest,
  },
} = require('@dashevo/dapi-grpc');

const grpcErrorCodes = require('@dashevo/grpc-common/lib/server/error/GrpcErrorCodes');

/**
 * @param {GrpcTransport} grpcTransport
 * @returns {getIdentityByPublicKeyHash}
 */
function getIdentityByPublicKeyHashFactory(grpcTransport) {
  /**
   * Fetch the identity by public key hash
   *
   * @typedef {getIdentityByPublicKeyHash}
   * @param {string} publicKeyHash
   * @param {DAPIClientOptions} [options]
   * @returns {Promise<!Buffer|null>}
   */
  async function getIdentityByPublicKeyHash(publicKeyHash, options = {}) {
    const getIdentityByPublicKeyHashRequest = new GetIdentityByFirstPublicKeyRequest();
    getIdentityByPublicKeyHashRequest.setPublicKeyHash(Buffer.from(publicKeyHash, 'hex'));

    let getIdentityByPublicKeyHashResponse;
    try {
      getIdentityByPublicKeyHashResponse = await grpcTransport.request(
        PlatformPromiseClient,
        'getIdentityByPublicKeyHash',
        getIdentityByPublicKeyHashRequest,
        options,
      );
    } catch (e) {
      if (e.code === grpcErrorCodes.NOT_FOUND) {
        return null;
      }

      throw e;
    }

    const serializedIdentityBinaryArray = getIdentityByPublicKeyHashResponse.getIdentity();
    let identity = null;

    if (serializedIdentityBinaryArray) {
      identity = Buffer.from(serializedIdentityBinaryArray);
    }

    return identity;
  }

  return getIdentityByPublicKeyHash;
}

module.exports = getIdentityByPublicKeyHashFactory;
