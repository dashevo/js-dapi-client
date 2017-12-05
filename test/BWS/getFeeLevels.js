const should = require('should');
require('../_before.js');

describe('BWS - getFeeLevels', () => {
  it('should return the fee as a number', () => SDK.BWS.getFeeLevels('live')
    .then((res) => {
      res.should.be.a.Number();
    }));
});
