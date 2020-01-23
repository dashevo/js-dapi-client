const DAPIClient = require('../../../src/index');
const seeds = [
  '52.26.165.185',
  '54.202.56.123',
  '54.245.133.124',
].map(ip => ({service: `${ip}:3000`}));
const datacontracts={
  'dpns':'2KfMcMxktKimJxAZUeZwYkFUsEcAZhDKEpQs8GMnpUse'
}
//TODO: right now onto devnet. Fix me when testnet is up and running.
describe('E2E tests against testnet', function suite(){
  this.timeout(20000);
  let client;
  let bestBlockHash;
  before(async () => {
    client = new DAPIClient({
      seeds: seeds,
      timeout: 1000,
      retries: 5,
      network: 'testnet'
    });
  })
  it('should be initialized', function () {
    expect(client).to.exist;
    expect(client.dpp).to.exist;
    expect(client.DAPIPort).to.equal(3000);
    expect(client.nativeGrpcPort).to.equal(3010);
    expect(client.timeout).to.equal(1000);
    expect(client.retries).to.equal(5);
  });
  it('should getBestBlockHeight', async function () {
    const bestBlockHeight = await client.getBestBlockHeight();
    expect(typeof bestBlockHeight).to.be.equal('number');
    expect(bestBlockHeight).to.be.gt(0);
  });
  it('should get best block hash', async function () {
    bestBlockHash = await client.getBestBlockHash();
    expect(typeof bestBlockHash).to.be.equal('string');
    expect(bestBlockHash.length).to.equal(64)
    expect(bestBlockHash.startsWith('0000')).to.equal(true);
  });
  it('should get best raw block', async function () {
    const bestRawBlock = await client.getRawBlock(bestBlockHash);
    expect(bestRawBlock.startsWith('0000')).to.equal(true);
  });
  it('should get an app identity', async function () {
    const rawIdentity = await client.getIdentity(datacontracts.dpns);
    expect(rawIdentity.toString().includes(datacontracts.dpns)).to.equal(true);
  });
  it('should getDataContract', async function () {
    const rawContract = await client.getDataContract(datacontracts.dpns);
    const contractIdFromRawContract = rawContract.toString().substr(rawContract.length-44);
    expect(contractIdFromRawContract).to.equal(datacontracts.dpns);
  });
});
