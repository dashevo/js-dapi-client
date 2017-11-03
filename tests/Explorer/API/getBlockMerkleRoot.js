require('../../_before.js');
const should = require('should');

const validBlockHash = '00000000e77f43412f0a536c1a02cc7ca4c84ce812122a0a4efe6bef386ee8dd';
const validBlockHeight = 195460;
describe('Insight-API - getBlockMerkleRoot', () => {
  it('should return the valid getBlockMerkleRoot from hash', () => SDK.Explorer.API.getBlockMerkleRoot(validBlockHash)
    .then(merkleRoot => merkleRoot.should.equal('e270a45c438fb8befead6b3c9e88201b0aa96e5f43920fb78fdb8dbb3e433e04')));
  it('should return the valid confirmations from height', () => SDK.Explorer.API.getBlockMerkleRoot(validBlockHeight)
    .then(merkleRoot => merkleRoot.should.equal('e270a45c438fb8befead6b3c9e88201b0aa96e5f43920fb78fdb8dbb3e433e04')));
});
