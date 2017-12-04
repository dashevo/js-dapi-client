require('../../_before.js');
const should = require('should');

const validBlockHash = '00000000e77f43412f0a536c1a02cc7ca4c84ce812122a0a4efe6bef386ee8dd';
const validBlockHeight = 195460;
describe('Insight-API - getBlockTime', () => {
  it('should return the valid getBlockTime from hash', () => SDK.Explorer.API.getBlockTime(validBlockHash)
    .then(blockTime => blockTime.should.equal(1493937194)));
  it('should return the valid getBlockTime from height', () => SDK.Explorer.API.getBlockTime(validBlockHeight)
    .then(blockTime => blockTime.should.equal(1493937194)));
});
