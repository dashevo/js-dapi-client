sould = require('should');
require('../_before.js');

const addrs = ['yb21342iADyqAotjwcn4imqjvAcdYhnzeH', 'yUGETMg58sQd7mTHEZJKqaEYvvXc7udrsh'];

describe('BWS - getBalance', () => {
  it('should return the fee as a number', () => SDK.BWS.getBalance(1, (err, x) => x, addrs[0])
    .then((bal) => {
      bal.should.be.a.Number();
      bal.should.be.aboveOrEqual(0);
    }));
});
