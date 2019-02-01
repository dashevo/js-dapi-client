/**
 * This module provides list of masternode addresses.
 * No need to use this module manually - it's part of MNDiscovery.
 * It is written as class for testability purposes - there is need to be a way to
 * reset internal state of object.
 * @module MasternodeListProvider
 */

const { MerkleProof, SpvChain } = require('@dashevo/dash-spv');
const { SimplifiedMNList, Transaction } = require('@dashevo/dashcore-lib');
const sample = require('lodash/sample');
const RPCClient = require('../RPCClient');
const config = require('../config');

const headerChain = new SpvChain('testnet');

function isValidDiffListProofs(diff, header) { // eslint-disable-line no-unused-vars
  return MerkleProof.validateMnProofs(
    header,
    diff.cbTxMerkleTree.merkleFlags,
    diff.cbTxMerkleTree.merkleHashes,
    diff.cbTxMerkleTree.totalTransactions,
    diff.cbTx.hash,
  );
}

async function verifyDiff(diff, blockHash) {
  const cbTx = Transaction.Payload.CoinbasePayload.fromBuffer(diff.cbTx);
  const cbTxHeader = await headerChain.getHeader(blockHash);
  if (!cbTxHeader) {
    throw new Error(`Failed to find cbTxHeader in header store for block hash ${blockHash} with height ${cbTx.height}`);
  }

  if (!isValidDiffListProofs(diff, cbTxHeader)) {
    throw new Error('INVALID MNLIST! please query other dapi nodes');
  }

  return true;
}

/**
 * This class holds the valid deterministic masternode list
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

class MasternodeListProvider {
  constructor(seeds, DAPIPort = config.Api.port) {
    const seedsIsArray = Array.isArray(seeds);

    if (seeds && !seedsIsArray) {
      throw new Error('seed is not an array');
    }
    /**
     * Masternode list. Initial masternode list is DNS seed from SDK config.
     * @type Array<Masternode>
     */
    this.masternodeList = seedsIsArray ? seeds.slice() : config.DAPIDNSSeeds.slice();
    this.DAPIPort = DAPIPort;
    this.lastUpdateDate = 0;
    this.baseBlockHash = config.nullHash;
    this.blockHash = '';
  }

  async getValidMnList() {
    const diff = await this.getSimplifiedMNListDiff();
    if (!diff) {
      // TODO: query other dapi node
      throw new Error('INVALID MNLIST! please query other dapi nodes');
    }
    if (!verifyDiff(diff, this.blockHash)) {
      // TODO: query other dapi node
      throw new Error('INVALID MNLIST! please query other dapi nodes');
    }
    return new SimplifiedMNList(diff).getValidMasternodesList();
  }

  /**
   * @private
   * Fetches masternode diff from DAPI.
   * @returns {Promise<Array<SimplifiedMNListDiff>>}
   */
  async getSimplifiedMNListDiff() {
    const node = sample(this.masternodeList);
    const { baseBlockHash } = this.baseBlockHash;
    const blockHash = await RPCClient.request({
      host: node.ip,
      port: this.DAPIPort,
    }, 'getBestBlockHash', {});
    if (!blockHash) {
      throw new Error(`Failed to get best block hash for getSimplifiedMNListDiff from node ${node.ip}`);
    }
    this.blockHash = blockHash;
    const diff = await RPCClient.request({
      host: node.ip,
      port: this.DAPIPort,
    }, 'getMnListDiff', { baseBlockHash, blockHash });
    if (!diff) {
      throw new Error(`Failed to get mn diff from node ${node.ip}`);
    }
    this.baseBlockHash = diff.blockHash;
    return diff;
  }

  /**
   * @private
   * Updates masternodes list. No need to call it manually
   * @returns {Promise<void>}
   */
  async updateMNList() {
    const newMNList = await this.getValidMnList();
    // If mn list was updated
    if (newMNList.length) {
      console.log('newMNList', newMNList);
      this.masternodeList = newMNList;
    }
    this.lastUpdateDate = Date.now();
  }

  /**
   * @private
   * Checks whether masternode list needs update
   * @returns {boolean}
   */
  needsUpdate() {
    return Date.now() - config.MNListUpdateInterval > this.lastUpdateDate;
  }

  /**
   * Returns masternode list
   * @returns {Promise<Array<Masternode>>}
   */
  async getMNList() {
    if (this.needsUpdate()) {
      await this.updateMNList();
    }
    return this.masternodeList;
  }
}

module.exports = MasternodeListProvider;
