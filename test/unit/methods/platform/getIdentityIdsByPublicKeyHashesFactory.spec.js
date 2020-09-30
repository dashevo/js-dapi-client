const {
  v0: {
    PlatformPromiseClient,
    GetIdentityIdsByPublicKeyHashesRequest,
    GetIdentityIdsByPublicKeyHashesResponse,
    PublicKeyHashIdentityIdPair,
  },
} = require('@dashevo/dapi-grpc');

const getIdentityFixture = require('@dashevo/dpp/lib/test/fixtures/getIdentityFixture');

const getIdentityIdsByPublicKeyHashesFactory = require(
  '../../../../lib/methods/platform/getIdentityIdsByPublicKeyHashesFactory',
);

describe('getIdentityIdsByPublicKeyHashesFactory', () => {
  let grpcTransportMock;
  let getIdentityIdsByPublicKeyHashes;
  let options;
  let response;
  let identityFixture;
  let publicKeyHash;
  let publicKeyHashIdentityIdPair;

  beforeEach(function beforeEach() {
    identityFixture = getIdentityFixture();

    publicKeyHashIdentityIdPair = new PublicKeyHashIdentityIdPair();
    publicKeyHashIdentityIdPair.setPublicKeyHash(
      identityFixture.getPublicKeyById(0).hash(),
    );
    publicKeyHashIdentityIdPair.setIdentityId(
      Buffer.from(identityFixture.getId(), 'hex'),
    );

    response = new GetIdentityIdsByPublicKeyHashesResponse();
    response.setIdentityIdsByPublicKeyHashes(
      [publicKeyHashIdentityIdPair],
    );

    publicKeyHash = identityFixture.getPublicKeyById(0).hash();

    grpcTransportMock = {
      request: this.sinon.stub().resolves(response),
    };

    options = {
      timeout: 1000,
    };

    getIdentityIdsByPublicKeyHashes = getIdentityIdsByPublicKeyHashesFactory(grpcTransportMock);
  });

  it('should return public key hashes to identity map', async () => {
    const result = await getIdentityIdsByPublicKeyHashes([publicKeyHash], options);

    const request = new GetIdentityIdsByPublicKeyHashesRequest();
    request.setPublicKeyHashes([publicKeyHash]);

    expect(grpcTransportMock.request).to.be.calledOnceWithExactly(
      PlatformPromiseClient,
      'getIdentityIdsByPublicKeyHashes',
      request,
      options,
    );
    expect(result).to.deep.equal(identityFixture.serialize());
  });

  it('should throw unknown error', async () => {
    const error = new Error('Unknown found');

    grpcTransportMock.request.throws(error);

    const request = new GetIdentityIdsByPublicKeyHashesRequest();
    request.setPublicKeyHashes([publicKeyHash]);

    try {
      await getIdentityIdsByPublicKeyHashes(publicKeyHash, options);

      expect.fail('should throw unknown error');
    } catch (e) {
      expect(e).to.deep.equal(error);
      expect(grpcTransportMock.request).to.be.calledOnceWithExactly(
        PlatformPromiseClient,
        'getIdentityIdsByPublicKeyHashes',
        request,
        options,
      );
    }
  });
});
