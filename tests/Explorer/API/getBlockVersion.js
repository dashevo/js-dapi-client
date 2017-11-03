require('../../_before.js');
const should = require('should');

const validBlockHash = '00000000e77f43412f0a536c1a02cc7ca4c84ce812122a0a4efe6bef386ee8dd';
const validBlockHeight = 195460;
describe('Insight-API - getBlockVersion', () => {
  it('should return the valid getBlockVersion from hash', () => SDK.Explorer.API.getBlockVersion(validBlockHash)
    .then(version => version.should.equal(536870912)));
  it('should return the valid getBlockVersion from height', async () => SDK.Explorer.API.getBlockVersion(validBlockHeight)
    .then(version => version.should.equal(536870912)));
});
