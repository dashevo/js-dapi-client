const {
  v0: {
    PlatformPromiseClient,
    GetIdentitiesByPublicKeyHashesRequest,
    GetIdentitiesByPublicKeyHashesResponse,
    PublicKeyHashIdentityPair,
  },
} = require('@dashevo/dapi-grpc');

const getIdentityFixture = require('@dashevo/dpp/lib/test/fixtures/getIdentityFixture');

const getIdentitiesByPublicKeyHashesFactory = require(
  '../../../../lib/methods/platform/getIdentitiesByPublicKeyHashesFactory',
);

describe('getIdentitiesByPublicKeyHashesFactory', () => {
  let grpcTransportMock;
  let getIdentitiesByPublicKeyHashes;
  let options;
  let response;
  let identityFixture;
  let publicKeyHash;
  let publicKeyHashIdentityPair;

  beforeEach(function beforeEach() {
    identityFixture = getIdentityFixture();

    publicKeyHashIdentityPair = new PublicKeyHashIdentityPair();
    publicKeyHashIdentityPair.setPublicKeyHash(
      identityFixture.getPublicKeyById(0).hash(),
    );
    publicKeyHashIdentityPair.setIdentity(identityFixture.serialize());

    response = new GetIdentitiesByPublicKeyHashesResponse();
    response.setIdentitiesByPublicKeyHashes(
      [publicKeyHashIdentityPair],
    );

    publicKeyHash = identityFixture.getPublicKeyById(0).hash();

    grpcTransportMock = {
      request: this.sinon.stub().resolves(response),
    };

    options = {
      timeout: 1000,
    };

    getIdentitiesByPublicKeyHashes = getIdentitiesByPublicKeyHashesFactory(grpcTransportMock);
  });

  it('should return public key hashes to identity map', async () => {
    const result = await getIdentitiesByPublicKeyHashes([publicKeyHash], options);

    const request = new GetIdentitiesByPublicKeyHashesRequest();
    request.setPublicKeyHashes([publicKeyHash]);

    expect(grpcTransportMock.request).to.be.calledOnceWithExactly(
      PlatformPromiseClient,
      'getIdentitiesByPublicKeyHashes',
      request,
      options,
    );
    expect(result).to.deep.equal(identityFixture.serialize());
  });

  it('should throw unknown error', async () => {
    const error = new Error('Unknown found');

    grpcTransportMock.request.throws(error);

    const request = new GetIdentitiesByPublicKeyHashesRequest();
    request.setPublicKeyHashes([publicKeyHash]);

    try {
      await getIdentitiesByPublicKeyHashes(publicKeyHash, options);

      expect.fail('should throw unknown error');
    } catch (e) {
      expect(e).to.deep.equal(error);
      expect(grpcTransportMock.request).to.be.calledOnceWithExactly(
        PlatformPromiseClient,
        'getIdentitiesByPublicKeyHashes',
        request,
        options,
      );
    }
  });
});
