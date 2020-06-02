const createAddressProviderFromOptions = require(
  '../../../lib/addressProvider/createAddressProviderFromOptions',
);
const ListAddressProvider = require('../../../lib/addressProvider/ListAddressProvider');
const SMLAddressProvider = require('../../../lib/addressProvider/SMLAddressProvider');

const networks = require('../../../lib/networkConfigs');

const DAPIClientError = require('../../../lib/errors/DAPIClientError');

describe('createAddressProviderFromOptions', () => {
  describe('#addressProvider', () => {
    let options;
    let addressProvider;

    beforeEach(() => {
      addressProvider = 'addressProvider';

      options = {
        addressProvider,
      };
    });

    it('should return AddressProvider from `addressProvider` option', async () => {
      const result = createAddressProviderFromOptions(options);

      expect(result).to.equal(addressProvider);
    });

    it('should throw DAPIClientError if `address` option is passed too', async () => {
      options.address = 'localhost';

      try {
        createAddressProviderFromOptions(options);

        expect.fail('should throw DAPIClientError');
      } catch (e) {
        expect(e).to.be.an.instanceOf(DAPIClientError);
      }
    });

    it('should throw DAPIClientError if `seeds` option is passed too', async () => {
      options.seeds = ['127.0.0.1'];

      try {
        createAddressProviderFromOptions(options);

        expect.fail('should throw DAPIClientError');
      } catch (e) {
        expect(e).to.be.an.instanceOf(DAPIClientError);
      }
    });

    it('should throw DAPIClientError if `network` option is passed too', async () => {
      options.network = 'testnet';

      try {
        createAddressProviderFromOptions(options);

        expect.fail('should throw DAPIClientError');
      } catch (e) {
        expect(e).to.be.an.instanceOf(DAPIClientError);
      }
    });
  });

  describe('#address', () => {
    let options;

    beforeEach(() => {
      options = {
        address: 'localhost',
      };
    });

    it('should return ListAddressProvider with address', async () => {
      const result = createAddressProviderFromOptions(options);

      expect(result).to.be.an.instanceOf(ListAddressProvider);
    });

    it('should throw DAPIClientError if `seeds` option is passed too', async () => {
      options.seeds = ['127.0.0.1'];

      try {
        createAddressProviderFromOptions(options);

        expect.fail('should throw DAPIClientError');
      } catch (e) {
        expect(e).to.be.an.instanceOf(DAPIClientError);
      }
    });

    it('should throw DAPIClientError if `network` option is passed too', async () => {
      options.network = 'testnet';

      try {
        createAddressProviderFromOptions(options);

        expect.fail('should throw DAPIClientError');
      } catch (e) {
        expect(e).to.be.an.instanceOf(DAPIClientError);
      }
    });
  });

  describe('#seeds', () => {
    let options;

    beforeEach(() => {
      options = {
        seeds: ['127.0.0.1'],
      };
    });

    it('should return SMLAddressProvider based on seeds', async () => {
      const result = createAddressProviderFromOptions(options);

      expect(result).to.be.an.instanceOf(SMLAddressProvider);
    });

    it('should throw DAPIClientError if `network` option is passed too', async () => {
      options.network = 'testnet';

      try {
        createAddressProviderFromOptions(options);

        expect.fail('should throw DAPIClientError');
      } catch (e) {
        expect(e).to.be.an.instanceOf(DAPIClientError);
      }
    });
  });

  describe('#network', () => {
    let options;

    beforeEach(() => {
      options = {
        network: Object.keys(networks)[0],
      };
    });

    it('should create address provider from `network` options', async () => {
      const result = createAddressProviderFromOptions(options);

      expect(result).to.be.an.instanceOf(SMLAddressProvider);
    });

    it('should throw DAPIClientError if `network` is invalid', async () => {
      options.network = 'unknown';

      try {
        createAddressProviderFromOptions(options);

        expect.fail('should throw DAPIClientError');
      } catch (e) {
        expect(e).to.be.an.instanceOf(DAPIClientError);
      }
    });
  });
});
