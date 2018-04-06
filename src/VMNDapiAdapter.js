/**
 * Copyright (c) 2017-present, Dash Core Team
 *
 * This source code is licensed under the MIT license found in the
 * COPYING file in the root directory of this source tree.
 */
const BitcoreLib = require('bitcore-lib-dash');
const VMN = require('@dashevo/dash-schema/vmn');
const Schema = require('@dashevo/dash-schema/lib');
const DAPI = require('./api');
const EventEmitter = require('eventemitter2');

const { Registration } = BitcoreLib.Transaction.SubscriptionTransactions;
const { TransitionHeader, TransitionPacket } = BitcoreLib.StateTransition;

/**
 * Virtual HTTPS Interface for DAPI test-stack module
 * @interface VMNDAPIAdapter
 */
class VMNDAPIAdapter {
  constructor(options) {
    this.events = new EventEmitter();
    this.DAPI = new DAPI(options ? options.seeds : null);
  }

  /**
   * Handles NewBlock ZMQ message from DashCore
   * @memberof DAPI
   * @param {object} blockInfo info object
   */
  _onNewBlock(blockInfo) {
    this.bestBlockInfo.height = blockInfo.height;
    this.bestBlockInfo.hash = blockInfo.hash;

    this.events.emit('newBlock', this.bestBlockInfo);
  }

  /**
   * Create a Blockchain blockchainuser via a SubTX
   * @param {json} obj Raw subtx
   * @memberof DAPI
   */
  async CreateUser(obj) {
    // this.log('Signup blockchainuser', obj.subtx.uname);
    const regTx = new Registration(obj);
    const regTxId = await this.DAPI.sendRawTransaction(regTx.serialize());
    // Mine 1 block to confirm regtx. Command available only in regtest mode.
    await this.DAPI.generate(1);
    return regTxId;
  }

  /**
   * Returns a single BlockchainUser Schema object for the specified username
   * @param {string} uname Blockchain Username
   * @memberof DAPI
   */
  async GetUserByName(uname) {
    if (!Schema.validate.username(uname)) {
      return null;
    }
    return this.DAPI.getUser(uname);
  }

  /**
   * Returns a single BlockchainUser Schema object for the specified uid
   * @param uid
   * @constructor
   */
  async GetUserById(uid) {
    return this.DAPI.getUser(uid);
  }

  /**
   * Search for blockchain users who match a given search pattern
   * @memberof DAPI
   * @param {string} pattern - search string
   * @returns {array} Array of matching blockchain blockchainuser accounts
   */
  async SearchUsers(pattern) {
    // No such method at the moment in DAPI RPC
    // let results = this.DashCore.searchusers(pattern);
    throw new Error('SearchUsers not implemented');
    // return results;
  }

  async GetDap(dapid) {
    // return this.DashDrive.getDapContract(dapid);
    throw new Error('GetDap not implemented');
  }

  async SearchDaps(pattern) {
    // return this.DashDrive.searchDapContracts(pattern);
    throw new Error('SearchDaps not implemented');
  }

  /**
   * Returns a users current dataset from DashDrive
   * @param {string} dapid Blockchain Username
   * @param {string} uid Hash of the DAP Schema
   * @memberof DAPI
   */
  async GetDapSpace(dapid, uid) {
    // let state = this.DashDrive.getDapSpace(dapid, uid);
    //
    // return state;
    throw new Error('GetDapSpace not implemented');
  }

  async GetDapContext(dapid, uid) {
    // let state = this.DashDrive.getDapContext(dapid, uid);
    // return state;
    throw new Error('GetDapContext not implemented');
  }

  /**
   * Updates a Blockchain blockchainuser's DAP data in DashCore (hash) and DashDrive (data).
   * The DAP space to use is determined from the dapid (hash) in the provided transition packet
   * @param {object} ts - State transition header
   * @param {object} tsp - State transition packet
   * @memberof DAPI
   */
  async UpdateDapSpace(ts, tsp) {
    if (Schema.object.validate(ts).valid === false) {
      throw new Error('Invalid tsheader');
    }

    if (Schema.object.validate(tsp).valid === false) {
      throw new Error('Invalid tpacket');
    }

    // TODO
    // Here we need to send data to dashdrive
    const header = new TransitionHeader(ts);
    const packet = new TransitionPacket(tsp);
    const tsid = await this.DAPI.sendRawTransition(
      header.serialize(),
      packet.toHexString(),
    );

    // Mine 1 block. This command available only in regtest mode.
    await this.DAPI.generate(1);

    return tsid;
  }
}

module.exports = VMNDAPIAdapter;
