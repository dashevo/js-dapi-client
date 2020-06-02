const SimplifiedMNList = require('@dashevo/dashcore-lib/lib/deterministicmnlist/SimplifiedMNList');

const SMLProvider = require('../../../lib/SMLProvider/SMLProvider');
const DAPIAddress = require('../../../lib/addressProvider/DAPIAddress');

const getFirstMNListDiffFixture = require('../../../lib/test/fixtures/getFirstMNListDiffFixture');
const getSecondMNListDiffFixture = require('../../../lib/test/fixtures/getSecondMNListDiffFixture');

const wait = require('../../../lib/test/utils/wait');

describe('SMLProvider', () => {
  let jsonTransportMock;
  let smlProvider;
  let lastUsedAddress;
  let firstMNListFixture;
  let secondMNListFixture;

  beforeEach(function beforeEach() {
    lastUsedAddress = new DAPIAddress('127.0.0.1');

    jsonTransportMock = {
      request: this.sinon.stub(),
      getLastUsedAddress: this.sinon.stub().returns(lastUsedAddress),
    };

    firstMNListFixture = getFirstMNListDiffFixture();
    secondMNListFixture = getSecondMNListDiffFixture();

    jsonTransportMock.request.withArgs('getBestBlockHash').onCall(0).resolves(
      firstMNListFixture.blockHash,
    );

    jsonTransportMock.request.withArgs('getBestBlockHash').onCall(1).resolves(
      secondMNListFixture.blockHash,
    );

    jsonTransportMock.request.withArgs('getMnListDiff').onCall(0).resolves(
      firstMNListFixture,
    );

    jsonTransportMock.request.withArgs('getMnListDiff').onCall(1).resolves(
      secondMNListFixture,
    );

    smlProvider = new SMLProvider(jsonTransportMock, { updateInterval: 50 });
  });

  describe('#getSimplifiedMNList', () => {
    it('should update SML and return list of valid masternodes', async () => {
      expect(smlProvider.lastUpdateDate).to.equal(0);
      expect(smlProvider.baseBlockHash).to.equal(SMLProvider.NULL_HASH);

      const sml = await smlProvider.getSimplifiedMNList();

      expect(sml).to.be.an.instanceOf(SimplifiedMNList);
      expect(sml.mnList).to.have.lengthOf(firstMNListFixture.mnList.length);

      expect(smlProvider.lastUpdateDate).to.not.equal(0);
      expect(smlProvider.baseBlockHash).to.equal(firstMNListFixture.blockHash);

      expect(jsonTransportMock.request).to.be.calledTwice();

      expect(jsonTransportMock.request.getCall(0).args).to.deep.equal([
        'getBestBlockHash',
      ]);
      expect(jsonTransportMock.request.getCall(1).args).to.deep.equal([
        'getMnListDiff',
        { baseBlockHash: SMLProvider.NULL_HASH, blockHash: firstMNListFixture.blockHash },
        { addresses: [lastUsedAddress] },
      ]);
    });

    it('should return the previous list of valid masternodes in case if update interval is not reached', async () => {
      await smlProvider.getSimplifiedMNList();

      expect(jsonTransportMock.request).to.be.calledTwice();

      // noinspection DuplicatedCode
      const sml = await smlProvider.getSimplifiedMNList();

      expect(sml).to.be.an.instanceOf(SimplifiedMNList);
      expect(sml.mnList).to.have.lengthOf(firstMNListFixture.mnList.length);

      expect(jsonTransportMock.request).to.be.calledTwice();
    });

    it('should use updated baseBlockHash for the second call', async () => {
      const firstSML = await smlProvider.getSimplifiedMNList();

      expect(firstSML).to.be.an.instanceOf(SimplifiedMNList);
      expect(firstSML.mnList).to.have.lengthOf(firstMNListFixture.mnList.length);

      expect(jsonTransportMock.request).to.be.calledTwice();

      await wait(50);

      const secondSML = await smlProvider.getSimplifiedMNList();

      expect(secondSML).to.be.an.instanceOf(SimplifiedMNList);
      expect(secondSML.mnList).to.have.lengthOf(122);

      expect(jsonTransportMock.request).to.be.callCount(4);

      expect(jsonTransportMock.request.getCall(2).args).to.deep.equal([
        'getBestBlockHash',
      ]);
      expect(jsonTransportMock.request.getCall(3).args).to.deep.equal([
        'getMnListDiff',
        { baseBlockHash: firstMNListFixture.blockHash, blockHash: secondMNListFixture.blockHash },
        { addresses: [lastUsedAddress] },
      ]);
    });
  });
});
