const ListAddressProvider = require('../../../lib/addressProvider/ListAddressProvider');
const DAPIAddress = require('../../../lib/addressProvider/DAPIAddress');

describe('ListAddressProvider', () => {
  let listAddressProvider;
  let addresses;
  let options;
  let bannedAddressHost;
  let notBannedAddressHost;

  beforeEach(() => {
    bannedAddressHost = '127.0.0.1';
    notBannedAddressHost = '192.168.1.1';

    const bannedAddress = new DAPIAddress(bannedAddressHost);
    bannedAddress.markAsBanned();

    const notBannedAddress = new DAPIAddress(notBannedAddressHost);

    addresses = [
      bannedAddress,
      notBannedAddress,
    ];

    options = {};

    listAddressProvider = new ListAddressProvider(
      addresses,
      options,
    );
  });

  describe('#getLiveAddresses', () => {
    it('should return live addresses', () => {
      const liveAddresses = listAddressProvider.getLiveAddresses();

      expect(liveAddresses).to.have.lengthOf(1);
      expect(liveAddresses[0]).to.be.instanceOf(DAPIAddress);
      expect(liveAddresses[0].getHost()).to.equal(notBannedAddressHost);
    });

    it('should return empty array', () => {
      listAddressProvider.addresses.forEach((address) => {
        address.markAsBanned();
      });

      const liveAddresses = listAddressProvider.getLiveAddresses();

      expect(liveAddresses).to.have.lengthOf(0);
    });
  });

  describe('#getLiveAddress', () => {
    it('should return random live address', async () => {
      const address = await listAddressProvider.getLiveAddress();

      expect(address).to.be.instanceOf(DAPIAddress);
      expect(address.getHost()).to.equal(notBannedAddressHost);
    });

    it('should return undefined when there are no live addresses', async () => {
      listAddressProvider.addresses.forEach((address) => {
        address.markAsBanned();
      });

      const address = await listAddressProvider.getLiveAddress();

      expect(address).to.be.undefined();
    });
  });

  describe('#hasLiveAddresses', () => {
    it('should return true if we have at least one unbanned address', async () => {
      const hasAddresses = await listAddressProvider.hasLiveAddresses();

      expect(hasAddresses).to.be.true();
    });

    it('should return false', async () => {
      listAddressProvider.addresses.forEach((address) => {
        address.markAsBanned();
      });

      const hasAddresses = await listAddressProvider.hasLiveAddresses();

      expect(hasAddresses).to.be.false();
    });
  });
});
