require('../../_before.js');
const should = require('should');

const validBlockHash = '00000000e77f43412f0a536c1a02cc7ca4c84ce812122a0a4efe6bef386ee8dd';
const validBlockHeight = 195460;
describe('Insight-API - getBlockConfirmations', () => {
  it('should return the valid confirmations from hash', () => Promise.all([SDK.Explorer.API.getLastBlock(), SDK.Explorer.API.getBlockConfirmations(validBlockHash)])
    .then(([lastBlock, confirmations]) => {
      const expectedDiff = (lastBlock.height - validBlockHeight) + 1;
      confirmations.should.equal(expectedDiff);
    })
    .catch((e) => {
      console.log(e);
    }));
  it('should return the valid confirmations from height', () => Promise.all([SDK.Explorer.API.getLastBlock(), SDK.Explorer.API.getBlockConfirmations(validBlockHash)])
    .then(([lastBlock, confirmations]) => {
      const expectedDiff = (lastBlock.height - validBlockHeight) + 1;
      confirmations.should.equal(expectedDiff);
    })
    .catch((e) => {
      console.log(e);
    }));
});
