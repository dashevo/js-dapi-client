const {
  SimplifiedMNList,
  SimplifiedMNListDiff,
} = require('@dashevo/dashcore-lib');

class SMLProvider {
  /**
   *
   * @param {JsonRpcTransport} jsonRpcTransport
   * @param {ListAddressProvider} addressProvider
   * @param [options]
   * @param [options.updateInterval=60000]
   */
  constructor(jsonRpcTransport, addressProvider, options = {}) {
    this.jsonRpcTransport = jsonRpcTransport;
    this.addressProvider = addressProvider;

    this.options = {
      updateInterval: 60000,
      ...options,
    };

    /**
     * Deterministic simplified masternode list.
     * @type Array<SimplifiedMNListEntry>
     */
    this.masternodeList = [];
    this.simplifiedMNList = new SimplifiedMNList();
    this.lastUpdateDate = 0;
    this.baseBlockHash = SMLProvider.NULL_HASH;
  }

  /**
   * Returns simplified masternode list
   *
   * @returns {Promise<Array<SimplifiedMNListEntry>>}
   */
  async getMasternodeList() {
    if (this.needsUpdate()) {
      await this.updateMasternodeList();
    }

    return this.masternodeList;
  }

  /**
   * Checks whether simplified masternode list needs update
   *
   * @private
   * @returns {boolean}
   */
  needsUpdate() {
    return Date.now() - this.options.updateInterval > this.lastUpdateDate;
  }

  /**
   * @private
   * Updates simplified masternodes list. No need to call it manually
   * @returns {Promise<void>}
   */
  async updateMasternodeList() {
    const diff = await this.getSimplifiedMNListDiff();

    this.simplifiedMNList.applyDiff(diff);

    const validMasternodesList = this.simplifiedMNList.getValidMasternodesList();
    if (!validMasternodesList.length) {
      throw new Error('No MNs in list. Can\'t connect to the network.');
    }

    this.masternodeList = validMasternodesList;

    this.baseBlockHash = diff.blockHash;

    this.lastUpdateDate = Date.now();
  }

  /**
   * @private
   * Fetches masternode diff from DAPI.
   * @returns {Promise<SimplifiedMNListDiff>}
   */
  async getSimplifiedMNListDiff() {
    const blockHash = await this.jsonRpcTransport.request('getBestBlockHash');

    const rawSimplifiedMNListDiff = await this.jsonRpcTransport.request(
      'getMnListDiff',
      { baseBlockHash: this.baseBlockHash, blockHash },
      { address: this.jsonRpcTransport.getLastUsedAddress() },
    );

    return new SimplifiedMNListDiff(rawSimplifiedMNListDiff);
  }
}

SMLProvider.NULL_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

module.exports = SMLProvider;
