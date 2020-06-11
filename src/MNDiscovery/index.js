/**
 * This module's responsibility is to obtain masternode IPs in order to
 * provide those IPs for DAPIService, which provides an interface for making
 * requests to DAPI.
 *  @module MNDiscoveryService
 */

const sample = require('lodash/sample');

class MNDiscovery {
  /**
   * @class
   * @param {MasternodeListProvider} masternodeListProvider
   */
  constructor(masternodeListProvider) {
    /**
     * @private
     * @protected
     * For test purposes only: tests wraps .getMNList() method of that object to ensure
     * it was called.
     */
    this.masternodeListProvider = masternodeListProvider;
  }

  /**
   * @returns {Promise<SimplifiedMNListEntry>}
   */
  async getRandomMasternode(excludedIps) {
    let MNList = await this.masternodeListProvider.getMNList();
    if (Array.isArray(excludedIps)) {
      MNList = MNList.filter((mn) => excludedIps.indexOf(mn.service.split(':')[0]) < 0);
    }
    return sample(MNList);
  }

  /**
   * @returns {Promise<Array<SimplifiedMNListEntry>>}
   */
  getMNList() {
    return this.masternodeListProvider.getMNList();
  }
}

module.exports = MNDiscovery;
