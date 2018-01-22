const should = require('should');

xdescribe('Init DAPI-SDK', () => {
  it('should have the right components', () => REFSDK()
    .then((success) => {
      should.exist(global.SDK);
      global.SDK.should.have.property('Accounts');
      global.SDK.should.have.property('Discover');
      global.SDK.should.have.property('Explorer');
      global.SDK.should.have.property('Quorum');
      global.SDK.should.have.property('SPV');
    }));
});
