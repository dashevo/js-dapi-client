const {
  v0: {
    PlatformPromiseClient,
    WaitForStateTransitionResultRequest,
  },
} = require('@dashevo/dapi-grpc');

/**
 *
 * @param {GrpcTransport} grpcTransport
 * @returns {waitForStateTransitionResult}
 */
function waitForStateTransitionResultFactory(grpcTransport) {
  /**
   * @typedef waitForStateTransitionResult
   * @param {Buffer} stateTransitionHash
   * @param {boolean} prove
   * @param {DAPIClientOptions & getDocumentsOptions} [options]
   * @returns {Promise<Object>}
   */
  async function waitForStateTransitionResult(stateTransitionHash, prove, options = {}) {
    // eslint-disable-next-line no-param-reassign
    options = {
      // Set default timeout
      ...options,
      timeout: 60000,
    };

    const waitForStateTransitionResultRequest = new WaitForStateTransitionResultRequest();

    waitForStateTransitionResultRequest.setStateTransitionHash(stateTransitionHash);
    waitForStateTransitionResultRequest.setProve(prove);

    const waitForStateTransitionResultResponse = await grpcTransport.request(
      PlatformPromiseClient,
      'waitForStateTransitionResult',
      waitForStateTransitionResultRequest,
      options,
    );

    const hash = waitForStateTransitionResultResponse.getStateTransitionHash();
    const error = waitForStateTransitionResultResponse.getError();
    const proof = waitForStateTransitionResultResponse.getProof();

    const result = {
      hash,
    };

    if (proof) {
      result.proof = {
        rootTreeProof: proof.getRootTreeProof(),
        storeTreeProof: proof.getStoreTreeProof(),
      };
    }

    if (error) {
      result.error = {
        code: error.getCode(),
        log: error.getLog(),
      };
    }

    return result;
  }

  return waitForStateTransitionResult;
}

module.exports = waitForStateTransitionResultFactory;
