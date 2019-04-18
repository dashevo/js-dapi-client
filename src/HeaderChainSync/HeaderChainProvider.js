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

const log = console;

async function logOutput(msg, delay = 50) {
  log.info(`${msg}`);
  await new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Create and setup DAPI client instance
 *
 * @param {SimplifiedMNListEntry[]} mnListEntries
 *
 * @return {Promise<DAPIClient>}
 */
async function initApi(mnListEntries) {
  const services = mnListEntries.map(entry => Object.create({ service: entry.service }));
  return new Api({
    seeds: services,
    port: 3000,
  });
}

async function getHeaderStoreFromChunks(chunks) {
  // putting the chunks into the correct order
  chunks.sort((a, b) => a.from - b.from);
  const store = [];

  // fill up store
  chunks.forEach((chunk) => {
    const baseHeight = chunk.from;
    chunk.items.forEach((h, i) => {
      store.push({ height: (baseHeight + i), header: h });
    });
  });
  return store;
}

async function printHeaderStore(store) {
  store.forEach(async (h) => {
    await logOutput(`Height ${h.height}: ${h.header} `);
  });
}

/**
 * Retrieve headers for a slice and populate header chain
 *
 * @param {DAPIClient} api
 * @param {object[]} headerChunks
 * @param {SpvChain} headerChain
 * @param {int} fromHeight
 * @param {int} toHeight
 * @param {int} step
 * @param {int} offset
 * @param {int} [extraHeight=0]
 *
 * @returns {Promise<array>}
 */
async function populateHeaderChain(
  api, headerChunks, headerChain, fromHeight, toHeight,
  step, offset, extraHeight = 0,
) {
  for (let height = fromHeight; height < toHeight - extraHeight; height += step) {
    /* eslint-disable-next-line no-await-in-loop */
    const newHeaders = await api.getBlockHeaders(height, step);
    /* eslint-disable-next-line no-await-in-loop */
    await logOutput(`newHeaders ${newHeaders}`);
    headerChain.addHeaders(newHeaders);
    headerChunks.push({
      from: (height - offset),
      to: ((height - offset) + step),
      items: newHeaders,
    });
  }

  if (extraHeight > 0) {
    const extraHeaders = await api.getBlockHeaders(toHeight, extraHeight);
    headerChain.addHeaders(extraHeaders);
    headerChunks.push({
      from: (toHeight - offset),
      to: ((toHeight - offset) + extraHeight),
      items: extraHeaders,
    });
  }
}

/**
 * This class syncs the header chain in a parallel manner across masternodes
 * and updates it when getMNList() is called after
 * a certain interval has passed. NB: getMNList() returns
 * an array of only valid simplified MN entries and not the entire list.
 * @type {SimplifiedMNListEntry[]}
 * @property {string} proRegTxHash
 * @property {string} confirmedHash
 * @property {string} service - ip and port
 * @property {string} pubKeyOperator - operator public key
 * @property {string} keyIDVoting - public key hash, 20 bytes
 * @property {boolean} isValid
 */

class HeaderChainProvider {
  constructor(seeds, DAPIPort = config.Api.port) {
    const seedsIsArray = Array.isArray(seeds);

    if (seeds && !seedsIsArray) {
      throw new Error('seed is not an array');
    }
    /**
     * @type Array<SimplifiedMNListEntry>
     */
    this.seeds = seedsIsArray ? seeds.slice() : config.DAPIDNSSeeds.slice();
    this.DAPIPort = DAPIPort;
    this.MNDiscovery = new MNDiscovery(this.seeds, this.DAPIPort);
  }

  /**
   * @private
   * Build the header chain for a specified slice
   * @param {DAPIClient} api1
   * @param {SimplifiedMNListEntry[]} mnListEntries
   * @param {int} fromHeight

   * @return {Promise<SpvChain>}
   */
  /* eslint-disable-next-line class-methods-use-this */
  async buildHeaderChain(api, mnListEntries, fromHeight) {
    // Start time to check method call time
    const hrStartTime = process.hrtime();

    const fromBlockHash = await api.getBlockHash(fromHeight);
    const fromBlockHeader = await api.getBlockHeader(fromBlockHash);
    const toHeight = await api.getBestBlockHeight();

    fromBlockHeader.prevHash = '0000000000000000000000000000000000000000000000000000000000000000';
    fromBlockHeader.bits = +(`0x${fromBlockHeader.bits}`);

    const numConfirms = 10000;

    const headerChain = new SpvChain('custom_genesis', numConfirms, fromBlockHeader);

    const heightDiff = toHeight - fromHeight;

    // temporary header store array. Can be used to attach to main header store later
    const headerChunks = [];

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

      await populateHeaderChain(
        api, headerChunks, headerChain, localFromHeight,
        localToHeight, step, fromHeight, heightExtra,
      );
    });

    await Promise.all(promises);

    // NOTE: query a few nodes by repeating the process to make sure you on the longest chain
    // headerChain instance will automatically follow the longest chain, keep track of orphans, etc
    // implementation detail @ https://docs.google.com/document/d/1jV0zCie5rVbbK9TbhkDUbbaQ9kG9oU8XTAWMVYjRc2Q/edit#heading=h.trwvf85zn0se

    await logOutput(`Got headerChain with longest chain of length ${headerChain.getLongestChain().length}`);

    const hrEndTime = process.hrtime(hrStartTime);

    await logOutput(`buildHeaderChain took ${hrEndTime[0]}s ${hrEndTime[1] / 1000000}ms`);

    const headerStore = await getHeaderStoreFromChunks(headerChunks);
    await printHeaderStore(headerStore);
    await logOutput(`Got headerStore with longest chain of length ${headerStore.length}`);

    return headerStore;
  }

  /**
   * Returns simplified header chain from lastChainTipHeight to current chain tip
   * @param {number} lastChainTipHeight - height of the last header stored
   * @returns {Promise<Array<Object>>}
   */
  async sync(lastChainTipHeight) {
    const randomNodeCount = Math.min(
      Math.floor(this.MNDiscovery.getMNList().length / 100),
      constants.headerChainSync.MAX_SYNC_NODES,
    );
    const randomNodes = await this.MNDiscovery.getRandomMasternodes(randomNodeCount);
    const api = await initApi(randomNodes);
    return this.buildHeaderChain(api, randomNodes, lastChainTipHeight);
  }
}

module.exports = HeaderChainProvider;
