require('../../_before.js');
const should = require('should');

const validBlockHash = '00000000e77f43412f0a536c1a02cc7ca4c84ce812122a0a4efe6bef386ee8dd';
const validBlockHeight = 195460;
describe('Insight-API - getBlockSize', () => {
  it('should return the valid getBlockSize from hash', () => SDK.Explorer.API.getBlockSize(validBlockHash)
    .then(blockSize => blockSize.should.equal(1566)));
  it('should return the valid getBlockSize from height', () => SDK.Explorer.API.getBlockSize(validBlockHeight)
    .then(blockSize => blockSize.should.equal(1566)));
});
