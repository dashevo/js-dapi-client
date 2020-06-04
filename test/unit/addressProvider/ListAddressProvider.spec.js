const ListAddressProvider = require('../../../lib/addressProvider/ListAddressProvider');
const DAPIAddress = require('../../../lib/addressProvider/DAPIAddress');

describe('ListAddressProvider', () => {
  let listAddressProvider;
  let addresses;
  let options;
  let bannedAddress;
  let notBannedAddress;

  beforeEach(() => {
    bannedAddress = new DAPIAddress('192.168.1.1');
    bannedAddress.markAsBanned();

    notBannedAddress = new DAPIAddress('192.168.1.2');

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

  describe('#constructor', () => {
    it('should set base ban time option', () => {
      const baseBanTime = 1000;

      listAddressProvider = new ListAddressProvider(
        addresses,
        { baseBanTime },
      );

      expect(listAddressProvider.options.baseBanTime).to.equal(baseBanTime);
    });

    it('should set default base ban time option if not passed', () => {
      listAddressProvider = new ListAddressProvider(
        addresses,
      );

      expect(listAddressProvider.options.baseBanTime).to.equal(60 * 1000);
    });
  });

  describe('#getLiveAddresses', () => {
    it('should return live addresses', () => {
      const bannedInThePastAddress = new DAPIAddress('192.168.1.3');
      bannedInThePastAddress.banCount = 1;
      bannedInThePastAddress.banStartTime = Date.now() - 3 * 60 * 1000;

      const bannedManyTimesAddress = new DAPIAddress('192.168.1.4');
      bannedManyTimesAddress.banCount = 3;
      bannedManyTimesAddress.banStartTime = Date.now() - 2 * 60 * 1000;

      listAddressProvider = new ListAddressProvider([
        bannedAddress,
        notBannedAddress,
        bannedInThePastAddress,
        bannedManyTimesAddress,
      ]);

      const liveAddresses = listAddressProvider.getLiveAddresses();

      expect(liveAddresses).to.have.lengthOf(2);
      expect(liveAddresses[0]).to.equal(notBannedAddress);
      expect(liveAddresses[1]).to.equal(bannedInThePastAddress);
    });

    it('should return empty array if all addresses are banned', () => {
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

      expect(address).to.equal(notBannedAddress);
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

  describe('#getAllAddresses', () => {
    it('should get all addresses', () => {
      const allAddresses = listAddressProvider.getAllAddresses();

      expect(allAddresses).to.deep.equal(listAddressProvider.addresses);
    });
  });

  describe('#setAddresses', () => {
    it('should set addresses and overwrite previous', () => {
      addresses = [
        notBannedAddress,
      ];
      listAddressProvider.setAddresses(addresses);

      expect(listAddressProvider.addresses).to.deep.equal(addresses);
    });
  });
});
