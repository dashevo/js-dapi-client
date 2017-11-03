require('../../_before.js');
const should = require('should');

const validBlockHash = '00000000e77f43412f0a536c1a02cc7ca4c84ce812122a0a4efe6bef386ee8dd';
const validBlockHeight = 195460;
describe('Insight-API - getHashFromHeight', () => {
  it('should return the valid Height from hash', () => SDK.Explorer.API.getHashFromHeight(validBlockHeight)
    .then(hash => hash.should.equal(validBlockHash)));
});
