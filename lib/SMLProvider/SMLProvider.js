const SimplifiedMNList = require('@dashevo/dashcore-lib/lib/deterministicmnlist/SimplifiedMNList');
const SimplifiedMNListDiff = require('@dashevo/dashcore-lib/lib/deterministicmnlist/SimplifiedMNListDiff');

class SMLProvider {
  /**
   *
   * @param {JsonRpcTransport} jsonRpcTransport
   * @param [options]
   * @param [options.updateInterval=60000]
   * @param [options.networkType]
   */
  constructor(jsonRpcTransport, options = {}) {
    this.jsonRpcTransport = jsonRpcTransport;

    this.options = {
      updateInterval: 60000,
      ...options,
    };

    this.simplifiedMNList = new SimplifiedMNList(undefined, this.options.networkType);

    this.lastUpdateDate = 0;

    this.baseBlockHash = SMLProvider.NULL_HASH;
  }

  /**
   * Returns simplified masternode list
   *
   * @returns {Promise<SimplifiedMNList>}
   */
  async getSimplifiedMNList() {
    if (this.needsUpdate()) {
      await this.updateMasternodeList();
    }

    return this.simplifiedMNList;
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

    return new SimplifiedMNListDiff(rawSimplifiedMNListDiff, this.options.networkType);
  }
}

SMLProvider.NULL_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

module.exports = SMLProvider;
