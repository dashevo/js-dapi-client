const sinon = require('sinon');
const dashcoreLib = require('@dashevo/dashcore-lib')

const HeaderChainProvider = require('../../../src/headerChainSync/HeaderChainProvider');
const DAPIClient = require('../../../src/index');
const MNDiscovery = require('../../../src/MNDiscovery/index');

const RPCClient = require('../../../src/RPCClient');

const MNListFixture = require('../../fixtures/mnList');
const { testnet2: testnetHeaders } = require('../../fixtures/headers');

describe('HeaderChainProvider', function main() {
  let requestStub;
  let getRandomMasternodeStub;

  this.timeout(10000);

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

    getRandomMasternodeStub = sinon.stub(MNDiscovery.prototype, 'getRandomMasternode')
      .resolves(MNListFixture.getFirstDiff().mnList[0]);
  });

  describe('#sync', () => {
    it('should successfully sync headers', async () => {
      requestStub
        .withArgs({ host: sinon.match.any, port: sinon.match.any }, 'getBlockHeaders', sinon.match.any)
        .resolves(testnetHeaders.slice(1, 500));

      const provider = new HeaderChainProvider('testnet', new DAPIClient({}), 5);
      const longestChain = await provider.sync(0);

      expect(longestChain.length).to.equal(500);
    });
  });

  after(() => {
    RPCClient.request.restore();
    getRandomMasternodeStub.restore();
  });
});
