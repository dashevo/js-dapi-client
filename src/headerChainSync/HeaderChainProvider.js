/**
 * This module syncs the header chain
 * No need to use this module manually - it's part of HeaderChainSync.
 * @module HeaderChainProvider
 */
const { SpvChain } = require('@dashevo/dash-spv');
const range = require('lodash/range');

/**
 * This class syncs the header chain in a parallel manner across masternodes
 */
class HeaderChainProvider {
  /**
   * @param {string} network
   * @param {DAPIClient} api
   * @param {int} mnListLength
   */
  constructor(network, api, mnListLength) {
    this.network = network;
    this.api = api;
    this.mnListLength = mnListLength;
  }

  /**
   * @private
   *
   * Retrieve headers for a slice and populate header chain
   *
   * @param {SpvChain} headerChain
   * @param {object} options
   * @param {int} options.fromHeight
   * @param {int} options.toHeight
   * @param {int} options.step
   * @param {int} options.offset
   * @param {int} [options.retryCount=0]
   * @param {int} [options.extraHeight=0]
   *
   * @returns {Promise<void>}
   */
  async populateHeaderChain(
    headerChain,
    {
      fromHeight, toHeight, step, offset, retryCount = 0, extraHeight = 0,
    },
  ) {
    const addHeadersPromises = range(fromHeight, toHeight - extraHeight, step)
      .map(async (height) => {
        const newHeaders = await this.api.getBlockHeaders(height, step);
        try {
          headerChain.addHeaders(newHeaders);
        } catch (e) {
          if (retryCount > 0) {
            await this.populateHeaderChain(
              headerChain, {
                fromHeight, toHeight, step, offset, retryCount: retryCount - 1,
              },
            );
          }
        }
      });

    await Promise.all(addHeadersPromises);

    if (extraHeight > 0) {
      const extraHeaders = await this.api.getBlockHeaders(toHeight, extraHeight);
      try {
        headerChain.addHeaders(extraHeaders);
      } catch (e) {
        if (retryCount > 0) {
          await this.populateHeaderChain(
            headerChain,
            {
              fromHeight, toHeight, step, offset, retryCount: retryCount - 1, extraHeight,
            },
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
   * @param {int} fromHeight

   * @return {Promise<SpvChain>}
   */
  async buildHeaderChain(fromHeight) {
    const fromBlockHash = await this.api.getBlockHash(fromHeight);
    const fromBlockHeader = await this.api.getBlockHeader(fromBlockHash);
    const toHeight = await this.api.getBestBlockHeight();

    const numConfirms = 10000;

    const headerChain = new SpvChain(this.network, numConfirms, fromBlockHeader);

    const heightDiff = toHeight - fromHeight;

    const heightDelta = Math.floor(heightDiff / this.mnListLength);
    const step = Math.min(heightDelta, 2000);

    /**
     * Naive worker-like implementation of a parallel calls
     *
     *    node1    node2     node3
     *   /    \   /    \   /       \
     *  |  |  |  |  |  |  |  |  |  |
     *  1  2  3  1  2  3  1  2  3  4
     * [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] - header chain
     *
     */

    const promises = range(this.mnListLength).map(async (index) => {
      const localFromHeight = fromHeight + (heightDelta * index);
      const localToHeight = localFromHeight + heightDelta;

      // Ask last node a few extra headers
      const heightExtra = (index === this.mnListLength - 1)
        ? heightDiff % Math.min(this.mnListLength, step) : 0;

      await this.populateHeaderChain(
        headerChain, {
          fromHeight: localFromHeight,
          toHeight: localToHeight,
          step,
          offset: fromHeight,
          retryCount: 5,
          extraHeight: heightExtra,
        },
      );
    });

    await Promise.all(promises);

    return headerChain;
  }

  /**
   * Returns simplified header chain from lastChainTipHeight to current chain tip
   * @param {number} lastChainTipHeight - height of the last header stored
   * @returns {Promise<Array<Object>>}
   */
  async sync(lastChainTipHeight) {
    const headerChain = await this.buildHeaderChain(lastChainTipHeight);

    return headerChain.getLongestChain();
  }
}

module.exports = HeaderChainProvider;
