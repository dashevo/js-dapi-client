/**
 * This module syncs the header chain
 * No need to use this module manually - it's part of HeaderChainSync.
 * @module HeaderChainProvider
 */
const { SpvChain } = require('@dashevo/dash-spv');
const Api = require('../');
const MNDiscovery = require('../MNDiscovery/index');
const config = require('../config');
const constants = require('../constants');

/**
 * This class syncs the header chain in a parallel manner across masternodes
 */
class HeaderChainProvider {
  /**
   * @param {SimplifiedMNListEntry[]} seeds
   * @param {number} DAPIPort
   */
  constructor(seeds, DAPIPort = config.Api.port) {
    const seedsIsArray = Array.isArray(seeds);

    if (seeds && !seedsIsArray) {
      throw new Error('seed is not an array');
    }

    this.seeds = seedsIsArray ? seeds.slice() : config.DAPIDNSSeeds.slice();
    this.DAPIPort = DAPIPort;
    this.MNDiscovery = new MNDiscovery(this.seeds, this.DAPIPort);
  }

  /**
   * @private
   *
   * Retrieve headers for a slice and populate header chain
   *
   * @param {DAPIClient} api
   * @param {SpvChain} headerChain
   * @param {int} fromHeight
   * @param {int} toHeight
   * @param {int} step
   * @param {int} offset
   * @param {int} [extraHeight=0]
   *
   * @returns {Promise<void>}
   */
  async populateHeaderChain(
    api, headerChain, fromHeight, toHeight,
    step, offset, retryCount = 0, extraHeight = 0,
  ) {
    for (let height = fromHeight; height < toHeight - extraHeight; height += step) {
      /* eslint-disable-next-line no-await-in-loop */
      const newHeaders = await api.getBlockHeaders(height, step);
      try {
        headerChain.addHeaders(newHeaders);
      } catch (e) {
        if (retryCount > 0) {
          /* eslint-disable-next-line no-await-in-loop */
          await this.populateHeaderChain(
            api, headerChain, fromHeight, toHeight, step, offset, retryCount - 1,
          );
        }
      }
    }

    if (extraHeight > 0) {
      const extraHeaders = await api.getBlockHeaders(toHeight, extraHeight);
      try {
        headerChain.addHeaders(extraHeaders);
      } catch (e) {
        if (retryCount > 0) {
          await this.populateHeaderChain(
            api, headerChain, fromHeight, toHeight, step, offset, retryCount - 1, extraHeight,
          );
        }
      }
    }
  }

  /**
   * @private
   *
   * Build the header chain for a specified slice
   *
   * @param {DAPIClient} api
   * @param {SimplifiedMNListEntry[]} mnListEntries
   * @param {int} fromHeight

   * @return {Promise<SpvChain>}
   */
  async buildHeaderChain(api, mnListEntries, fromHeight) {
    const fromBlockHash = await api.getBlockHash(fromHeight);
    const fromBlockHeader = await api.getBlockHeader(fromBlockHash);
    const toHeight = await api.getBestBlockHeight();

    fromBlockHeader.prevHash = '0000000000000000000000000000000000000000000000000000000000000000';
    fromBlockHeader.bits = +(`0x${fromBlockHeader.bits}`);

    const numConfirms = 10000;

    const headerChain = new SpvChain('custom_genesis', numConfirms, fromBlockHeader);

    const heightDiff = toHeight - fromHeight;

    const heightDelta = Math.floor(heightDiff / mnListEntries.length);
    const step = Math.min(heightDelta, 2000);

    /**
     * Naive worker-like implementation of a parallel calls
     *
     *    node1    node2     node3
     *   /    \   /    \   /       \
     *  |  |  |  |  |  |  |  |  |  |
     *  1  2  3  1  2  3  1  2  3  4
     * [1, 2, 3, 4, 5, 6, 7,height 8, 9, 10] - header chain
     *
     */

    const promises = mnListEntries.map(async (mnListEntry, index) => {
      const localFromHeight = fromHeight + (heightDelta * index);
      const localToHeight = localFromHeight + heightDelta;

      // Ask last node a few extra headers
      const heightExtra = (index === mnListEntries.length - 1)
        ? heightDiff % Math.min(mnListEntries.length, step) : 0;

      await this.populateHeaderChain(
        api, headerChain, localFromHeight,
        localToHeight, step, fromHeight, 5, heightExtra,
      );
    });

    await Promise.all(promises);

    return headerChain;
  }

  /**
   * @private
   *
   * Get random SimplifiedMNList entries
   *
   * @returns {Promise<SimplifiedMNListEntry[]>}
   */
  async getRandomMasternodes() {
    const randomNodeCount = Math.min(
      Math.floor(this.MNDiscovery.getMNList().length / 100),
      constants.headerChainSync.MAX_SYNC_NODES,
    );

    return this.MNDiscovery.getRandomMasternodes(randomNodeCount);
  }

  /**
   * @private
   *
   * Create and setup DAPI client instance
   *
   * @param {SimplifiedMNListEntry[]}
   *
   * @return {Promise<DAPIClient>}
   */
  /* eslint-disable-next-line class-methods-use-this */
  async initApi(mnListEntries) {
    const services = mnListEntries.map(entry => Object.create({ service: entry.service }));

    return new Api({
      seeds: services,
      port: 3000,
    });
  }

  /**
   * Returns simplified header chain from lastChainTipHeight to current chain tip
   * @param {number} lastChainTipHeight - height of the last header stored
   * @returns {Promise<Array<Object>>}
   */
  async sync(lastChainTipHeight) {
    const randomNodes = await this.getRandomMasternodes();

    const api = await this.initApi(randomNodes);

    const headerChain = await this.buildHeaderChain(api, randomNodes, lastChainTipHeight);

    return headerChain.getLongestChain();
  }
}

module.exports = HeaderChainProvider;
