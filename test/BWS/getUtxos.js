const should = require('should');
require('../_before.js');

const addrs = ['yb21342iADyqAotjwcn4imqjvAcdYhnzeH', 'yUGETMg58sQd7mTHEZJKqaEYvvXc7udrsh'];

describe('BWS - getUtxos', () => {
  it('should return the utxos of a address array', async () => SDK.BWS.getUtxos('placeholder', addrs)
    .then((res) => {
      res.should.be.a.Array();
      res[0].should.have.property('address');
      res[10].address.should.equal(addrs[1]);
    }));
});
