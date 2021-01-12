const {
  v0: {
    PlatformPromiseClient,
    WaitForStateTransitionResultRequest,
    StateTransitionBroadcastError,
    WaitForStateTransitionResultResponse,
    Proof,
  },
} = require('@dashevo/dapi-grpc');
const waitForStateTransitionResultFactory = require('../../../../lib/methods/platform/waitForStateTransitionResultFactory');

describe('waitForStateTransitionResultFactory', () => {
  let grpcTransportMock;
  let options;
  let response;
  let hash;
  let waitForStateTransitionResult;

  beforeEach(function beforeEach() {
    hash = Buffer.from('hash');
    response = new WaitForStateTransitionResultResponse();

    grpcTransportMock = {
      request: this.sinon.stub().resolves(response),
    };

    options = {
      timeout: 1000,
    };

    waitForStateTransitionResult = waitForStateTransitionResultFactory(grpcTransportMock);
  });

  it('should return response', async () => {
    response.setStateTransitionHash(hash);

    const result = await waitForStateTransitionResult(hash, false, options);

    expect(result).to.be.deep.equal({
      hash,
    });

    const request = new WaitForStateTransitionResultRequest();
    request.setStateTransitionHash(hash);
    request.setProve(false);

    expect(grpcTransportMock.request).to.be.calledOnceWithExactly(
      PlatformPromiseClient,
      'waitForStateTransitionResult',
      request,
      options,
    );
  });

  it('should return response with proof', async () => {
    const proof = new Proof();
    proof.setRootTreeProof(Buffer.from('rootTreeProof'));
    proof.setStoreTreeProof(Buffer.from('storeTreeProof'));

    response.setStateTransitionHash(hash);
    response.setProof(proof);

    const result = await waitForStateTransitionResult(hash, true, options);

    expect(result).to.be.deep.equal({
      hash,
      proof: {
        rootTreeProof: Buffer.from('rootTreeProof'),
        storeTreeProof: Buffer.from('storeTreeProof'),
      },
    });

    const request = new WaitForStateTransitionResultRequest();
    request.setStateTransitionHash(hash);
    request.setProve(true);

    expect(grpcTransportMock.request).to.be.calledOnceWithExactly(
      PlatformPromiseClient,
      'waitForStateTransitionResult',
      request,
      options,
    );
  });

  it('should return response with error', async () => {
    const error = new StateTransitionBroadcastError();
    error.setCode(2);
    error.setLog('Some error');

    response.setStateTransitionHash(hash);
    response.setError(error);

    const result = await waitForStateTransitionResult(hash, true, options);

    expect(result).to.be.deep.equal({
      hash,
      error: {
        code: 2,
        log: 'Some error',
      },
    });

    const request = new WaitForStateTransitionResultRequest();
    request.setStateTransitionHash(hash);
    request.setProve(true);

    expect(grpcTransportMock.request).to.be.calledOnceWithExactly(
      PlatformPromiseClient,
      'waitForStateTransitionResult',
      request,
      options,
    );
  });
});
