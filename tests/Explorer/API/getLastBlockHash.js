require('../../_before.js');
const should = require('should');

describe('Insight-API - getLastBlockHash', () => {
  it('should return the valid block hash', () => SDK.Explorer.API.getLastBlockHash()
    .then(blockHash => blockHash.should.be.type('string')));
});
