const should = require('should');
require('../_before.js');


describe('BWS - get fiat rate', () => {
  it('should return the rate', async () => {
    const res = await SDK.BWS.getFiatRate({}, {}, {}, {}); // other params
    res.should.be.a.Object();
    res.should.have.property('rate');
    res.rate.should.equal(120);
  });
});
