const DAPIClient = require('../../lib/DAPIClient');
const CoreMethodsFacade = require('../../lib/methods/core/CoreMethodsFacade');
const PlatformMethodsFacade = require('../../lib/methods/platform/PlatformMethodsFacade');
const SMLAddressProvider = require('../../lib/addressProvider/SMLAddressProvider');

describe('DAPIClient', () => {
  let options;
  let dapiClient;

  beforeEach(() => {
    options = {
      retries: 0,
      newOption: true,
    };

    dapiClient = new DAPIClient(options);
  });

  it('should set all variables in constructor', async () => {
    expect(dapiClient.options).to.deep.equal({
      retries: 0,
      newOption: true,
      timeout: 2000,
    });

    expect(dapiClient.addressProvider).to.be.an.instanceOf(SMLAddressProvider);

    expect(dapiClient.core).to.be.an.instanceOf(CoreMethodsFacade);
    expect(dapiClient.platform).to.be.an.instanceOf(PlatformMethodsFacade);
  });
});
