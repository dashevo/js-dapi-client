/**
 * This module responsibility is to obtain masternode IPs in order to
 * provide those IPs for DAPIService, which provides an interface for making
 * requests to DAPI.
 * Initial masternode list is dns seed - trusted servers which returns list of
 * other nodes in the network.
 *  @module MNDiscoveryService
 */

const sample = require('lodash/sample');
const MasternodeListProvider = require('./MasternodeListProvider');

const MNDiscoveryService = {
  /**
   * @returns {Promise<Masternode>}
   */
  async getRandomMasternode() {
    const MNList = await MasternodeListProvider.getMNList();
    return sample(MNList);
  },
  /**
   * @returns {Promise<Array<Masternode>>}
   */
  getMNList() {
    return MasternodeListProvider.getMNList();
  },
};

module.exports = MNDiscoveryService;
