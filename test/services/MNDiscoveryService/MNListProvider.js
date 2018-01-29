const MNListProvider = require('../../../src/services/MNDiscoveryService/MasternodeListProvider');
const sinon = require('sinon');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const RPCClient = require('../../../src/utils/RPCClient');
const config = require('../../../src/config');

chai.use(chaiAsPromised);
const { expect } = chai;

const testHost = 'stubbed_address';
const testPort = 4567;
const testPath = `http://${testHost}:${testPort}`;

const MockedMNList = [{
  vin: '54754314335419cc04ef09295ff7765c8062a6123486aed55fd7e9b04f300b13-0',
  status: 'ENABLED',
  rank: 1,
  ip: '138.156.10.21',
  protocol: 70208,
  payee: 'ycn5RWc4Ruo35FTS8bJwugVyCEkfVcrw9a',
  activeseconds: 1073078,
  lastseen: 1516291362,
},{
  vin: '54754314335419cc04ef09295ff7765c8062a6123486aed55fd7e9b04f300b13-0',
  status: 'ENABLED',
  rank: 1,
  ip: '171.86.98.52',
  protocol: 70208,
  payee: 'ycn5RWc4Ruo35FTS8bJwugVyCEkfVcrw9a',
  activeseconds: 1073078,
  lastseen: 1516291362,
},{
  vin: '54754314335419cc04ef09295ff7765c8062a6123486aed55fd7e9b04f300b13-0',
  status: 'ENABLED',
  rank: 1,
  ip: '146.81.95.64',
  protocol: 70208,
  payee: 'ycn5RWc4Ruo35FTS8bJwugVyCEkfVcrw9a',
  activeseconds: 1073078,
  lastseen: 1516291362,
}];

const updatedMNList = [{
  vin: '54754314335419cc04ef09295ff7765c8062a6123486aed55fd7e9b04f300b13-0',
  status: 'ENABLED',
  rank: 1,
  ip: '149.80.91.62',
  protocol: 70208,
  payee: 'ycn5RWc4Ruo35FTS8bJwugVyCEkfVcrw9a',
  activeseconds: 1073078,
  lastseen: 1516291362,
}];

describe('MNListProvider', async () => {

  describe('.getMNList()', async () => {

    before(() => {
      const RPCClientStub = sinon.stub(RPCClient, 'request');
      RPCClientStub
        .withArgs({ host: '127.0.0.1', port: config.DAPI.port }, 'getMNList', [])
        .returns(new Promise((resolve) => {
          resolve(MockedMNList);
        }));
    });

    after(() => {
      RPCClient.request.restore();
    });

    it('Should fetch MN list from DNS seeder if list has never updated', async() => {
      const mnListProvider = new MNListProvider();
      expect(mnListProvider.lastUpdateDate).to.equal(0);
      expect(mnListProvider.masternodeList.length).to.equal(1);
      expect(mnListProvider.masternodeList[0].ip).to.equal(config.DAPIDNSSeeds[0].ip);

      const MNList = await mnListProvider.getMNList();
      const MNListItem = MNList[0];

      expect(MNListItem.ip).to.be.a('string');
      expect(MNListItem.status).to.be.a('string');
      expect(MNListItem.rank).to.be.a('number');
      expect(MNListItem.lastseen).to.be.a('number');
      expect(MNListItem.activeseconds).to.be.a('number');

      expect(mnListProvider.lastUpdateDate).be.closeTo(Date.now(), 10000);
      expect(mnListProvider.masternodeList.length).to.equal(3);
    });

    it('Should update MNList if needed and return updated list', async () => {
      const mnListProvider = new MNListProvider();
      const MNList = await mnListProvider.getMNList();
      expect(MNList).to.be.an('array');
      const MNListItem = MNList[0];
      expect(MNListItem.ip).to.be.a('string');
      expect(MNListItem.status).to.be.a('string');
      expect(MNListItem.rank).to.be.a('number');
      expect(MNListItem.lastseen).to.be.a('number');
      expect(MNListItem.activeseconds).to.be.a('number');
    });
    it('Should return cached MNList if no update needed', async () => {
      const mnListProvider = new MNListProvider();
      const MNList = await mnListProvider.getMNList();

      expect(MNList).to.be.an('array');
      const MNListItem = MNList[0];
      expect(MNListItem.ip).to.be.a('string');
      expect(MNListItem.status).to.be.a('string');
      expect(MNListItem.rank).to.be.a('number');
      expect(MNListItem.lastseen).to.be.a('number');
      expect(MNListItem.activeseconds).to.be.a('number');
    });
    it('Should throw error if can\'t connect to dns seeder', async () => {

    });
    it('Should throw error if can\'t update masternode list', async () => {

    });
    it('Should not update list if fetched list is empty', async () => {

    });
  });

});