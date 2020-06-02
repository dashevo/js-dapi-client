const DAPIAddress = require('./DAPIAddress');

class SMLAddressProvider {
  /**
   *
   * @param {SMLProvider} smlProvider
   * @param {ListAddressProvider} listAddressProvider
   */
  constructor(smlProvider, listAddressProvider) {
    this.smlProvider = smlProvider;
    this.listAddressProvider = listAddressProvider;
  }

  /**
   * Get random live DAPI address from SML
   *
   * @return {Promise<DAPIAddress>}
   */
  async getLiveAddress() {
    const sml = await this.smlProvider.getSimplifiedMNList();
    const validMasternodeList = sml.getValidMasternodesList();

    const allAddresses = this.listAddressProvider.getAllAddresses();

    const updatedAddresses = validMasternodeList.map((smlEntry) => {
      let address = allAddresses
        .find((a) => smlEntry.proRegTxHash === a.getProRegTxHash());

      if (!address) {
        address = new DAPIAddress({
          host: smlEntry.getIp(),
          proRegTxHash: smlEntry.proRegTxHash,
        });
      } else {
        address.setHost(smlEntry.getIp());
      }

      return address;
    });

    this.listAddressProvider.setAddresses(updatedAddresses);

    return this.listAddressProvider.getLiveAddress();
  }

  /**
   * Check if we have live addresses left
   *
   * @return {Promise<boolean>}
   */
  async hasLiveAddresses() {
    return this.listAddressProvider.hasLiveAddresses();
  }
}

module.exports = SMLAddressProvider;
