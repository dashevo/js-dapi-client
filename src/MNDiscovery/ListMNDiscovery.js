/**
 * This module's responsibility is to obtain masternode IPs in order to
 * provide those IPs for DAPIService, which provides an interface for making
 * requests to DAPI.
 *  @module MNDiscoveryService
 */

const sample = require('lodash/sample');

const config = require('../config');

class ListMNDiscovery {
  /**
   * @class
   * @param {object[]} mnList
   */
  constructor(mnList) {
    const mnListIsArray = Array.isArray(mnList);

    if (mnList && !mnListIsArray) {
      throw new Error('seed is not an array');
    }

    /**
     * @type Array<SimplifiedMNListEntry>
     */
    this.setMNList(
      (mnListIsArray ? mnList.slice() : config.DAPIDNSSeeds.slice())
        .map((seed) => {
          if (!seed.getIp) {
            // eslint-disable-next-line no-param-reassign
            seed.getIp = () => seed.service.split(':')[0];
          }

          return seed;
        }),
    );
  }

  /**
   * @returns {Promise<SimplifiedMNListEntry>}
   */
  async getRandomMasternode(excludedIps) {
    return sample(
      this.mnList.filter((mn) => excludedIps.indexOf(mn.service.split(':')[0]) < 0),
    );
  }

  /**
   * @returns {Promise<Array<SimplifiedMNListEntry>>}
   */
  getMNList() {
    return this.mnList;
  }

  setMNList(mnList) {
    this.mnList = mnList;
  }
}

module.exports = ListMNDiscovery;
