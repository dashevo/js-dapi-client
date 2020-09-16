const {
  v0: {
    PlatformPromiseClient,
    GetIdentityByFirstPublicKeyRequest,
    GetIdentityByFirstPublicKeyResponse,
  },
} = require('@dashevo/dapi-grpc');

const getIdentityFixture = require('@dashevo/dpp/lib/test/fixtures/getIdentityFixture');
const grpcErrorCodes = require('@dashevo/grpc-common/lib/server/error/GrpcErrorCodes');

const getIdentityByPublicKeyHashFactory = require(
  '../../../../lib/methods/platform/getIdentityByPublicKeyHashFactory',
);

describe('getIdentityByPublicKeyHashFactory', () => {
  let grpcTransportMock;
  let getIdentityByPublicKeyHash;
  let options;
  let response;
  let identityFixture;
  let publicKeyHash;

  beforeEach(function beforeEach() {
    identityFixture = getIdentityFixture();

    response = new GetIdentityByFirstPublicKeyResponse();
    response.setIdentity(identityFixture.serialize());

    publicKeyHash = '556c2910d46fda2b327ef9d9bda850cc84d30db0';

    grpcTransportMock = {
      request: this.sinon.stub().resolves(response),
    };

    options = {
      timeout: 1000,
    };

    getIdentityByPublicKeyHash = getIdentityByPublicKeyHashFactory(grpcTransportMock);
  });

  it('should return identity', async () => {
    const result = await getIdentityByPublicKeyHash(publicKeyHash, options);

    const request = new GetIdentityByFirstPublicKeyRequest();
    request.setPublicKeyHash(Buffer.from(publicKeyHash, 'hex'));

    expect(grpcTransportMock.request).to.be.calledOnceWithExactly(
      PlatformPromiseClient,
      'getIdentityByPublicKeyHash',
      request,
      options,
    );
    expect(result).to.deep.equal(identityFixture.serialize());
  });

  it('should return null if identity not found', async () => {
    const error = new Error('Nothing found');
    error.code = grpcErrorCodes.NOT_FOUND;

    grpcTransportMock.request.throws(error);

    const result = await getIdentityByPublicKeyHash(publicKeyHash, options);

    const request = new GetIdentityByFirstPublicKeyRequest();
    request.setPublicKeyHash(Buffer.from(publicKeyHash, 'hex'));

    expect(grpcTransportMock.request).to.be.calledOnceWithExactly(
      PlatformPromiseClient,
      'getIdentityByPublicKeyHash',
      request,
      options,
    );
    expect(result).to.equal(null);
  });

  it('should throw unknown error', async () => {
    const error = new Error('Unknown found');

    grpcTransportMock.request.throws(error);

    const request = new GetIdentityByFirstPublicKeyRequest();
    request.setPublicKeyHash(Buffer.from(publicKeyHash, 'hex'));

    try {
      await getIdentityByPublicKeyHash(publicKeyHash, options);

      expect.fail('should throw unknown error');
    } catch (e) {
      expect(e).to.deep.equal(error);
      expect(grpcTransportMock.request).to.be.calledOnceWithExactly(
        PlatformPromiseClient,
        'getIdentityByPublicKeyHash',
        request,
        options,
      );
    }
  });
});
