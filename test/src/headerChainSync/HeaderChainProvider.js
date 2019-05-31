const sinon = require('sinon');
const proxyquire = require('proxyquire');
const dashcoreLib = require('@dashevo/dashcore-lib')

const RPCClient = require('../../../src/RPCClient');

const MNListFixture = require('../../fixtures/mnList');
const { testnet2: testnetHeaders } = require('../../fixtures/headers');

class MNDiscoveryMock {
  async getRandomMasternodes() {
    return [MNListFixture.getFirstDiff().mnList[0]];
  }

  async getRandomMasternode() {
    return MNListFixture.getFirstDiff()
      .mnList[0];
  }

  async getMNList() {
    return [];
  }
}

describe('HeaderChainProvider', () => {
  let requestStub;
  let HeaderChainProvider;

  before(() => {
    requestStub = sinon.stub(RPCClient, 'request');

    requestStub
      .withArgs({ host: sinon.match.any, port: sinon.match.any }, 'getBlockHash', sinon.match.any)
      .resolves(undefined);

    requestStub
      .withArgs({ host: sinon.match.any, port: sinon.match.any }, 'getBlockHeader', sinon.match.any)
      .resolves(new dashcoreLib.BlockHeader(new Buffer(testnetHeaders[0], 'hex')));

    requestStub
      .withArgs({ host: sinon.match.any, port: sinon.match.any }, 'getBestBlockHeight', sinon.match.any)
      .resolves(25);

    const API = proxyquire('../../../src/index', {
      './MNDiscovery/index': MNDiscoveryMock,
      './RPCClient': RPCClient,
    });

    HeaderChainProvider = proxyquire('../../../src/headerChainSync/HeaderChainProvider', {
      '../MNDiscovery/index': MNDiscoveryMock,
      '../': API,
    });
  });

  describe('#sync', () => {
    it('should successfully sync headers', async () => {
      requestStub
        .withArgs({ host: sinon.match.any, port: sinon.match.any }, 'getBlockHeaders', sinon.match.any)
        .resolves(testnetHeaders.slice(1, 500));

      const provider = new HeaderChainProvider('testnet', []);
      const longestChain = await provider.sync(0);

      expect(longestChain.length).to.equal(500);
    });
  });

  after(() => {
    RPCClient.request.restore();
  });
});
