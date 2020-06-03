/**
 * @param options - DAPI client options
 * @param {Array<Object>} [options.seeds] - seeds. If no seeds provided
 * default seed will be used.
 * @param {number} [options.port=3000] - default port for connection to the DAPI
 * @param {number} [options.nativeGrpcPort=3010] - Native GRPC port for connection to the DAPI
 * @param {number} [options.timeout=2000] - timeout for connection to the DAPI
 * @param {number} [options.retries=3] - num of retries if there is no response from DAPI node
 */

/**
 * Class for DAPI Client
 */
export default class DAPIClient {
  /**
   * Construct an instance of DAPI client
   */
  constructor(options: { retries: number; seeds: [string] | { service: string }[]; timeout: number; network: string });

  /**
   * Returns a summary (balance, txs) for a given address
   * @param {string|string[]} address or array of addresses
   * @param {boolean} [noTxList=false] - true if a list of all txs should NOT be included in result
   * @param {number} [from] - start of range for the tx to be included in the tx list
   * @param {number} [to] - end of range for the tx to be included in the tx list
   * @param {number} [fromHeight] - which height to start from (optional, overriding from/to)
   * @param {number} [toHeight] - on which height to end (optional, overriding from/to)
   * @returns {Promise<Object>} - an object with basic address info
   */
  getAddressSummary(address: string | string[], noTxList?: boolean, from?: number, to?: number, fromHeight?: number, toHeight?: number): Promise<object>;

  /**
   * Returns block hash of chaintip
   * @returns {Promise<string>}
   */
  getBestBlockHash(): Promise<string>;

  /**
   * Returns block hash for the given height
   * @param {number} height
   * @returns {Promise<string>} - block hash
   */
  getBlockHash(height: number): Promise<string>;

  /**
   * Get deterministic masternodelist diff
   * @param {string} baseBlockHash - hash or height of start block
   * @param {string} blockHash - hash or height of end block
   * @return {Promise<object>}
   */
  getMnListDiff(baseBlockHash: string, blockHash: string): Promise<object>;

  /**
   * Get block by height
   *
   * @param {number} height
   * @returns {Promise<null|Buffer>}
   */
  getBlockByHeight(height: number): Promise<null|Buffer>

  /**
   * Get block by hash
   *
   * @param {string} hash
   * @returns {Promise<null|Buffer>}
   */
  getBlockByHash(hash: string): Promise<null|Buffer>

  /**
   * Get Core chain status
   *
   * @returns {Promise<object>}
   */
  getStatus(): Promise<object>

  /**
   * Returns Transactions for a given address or multiple addresses
   * @param {string|string[]} address or array of addresses
   * @param {number} [from] - start of range in the ordered list of latest UTXO (optional)
   * @param {number} [to] - end of range in the ordered list of latest UTXO (optional)
   * @param {number} [fromHeight] - which height to start from (optional, overriding from/to)
   * @param {number} [toHeight] - on which height to end (optional, overriding from/to)
   * @returns {Promise<object>} - Object with pagination info and array of unspent outputs
   */
  getTransactionsByAddress(address: string | string[], from?: number, to?: number, fromHeight?: number, toHeight?: number): Promise<object>;

  /**
   * Get Transaction by ID
   *
   * @param {string} id - transaction hash
   * @returns {Promise<null|Buffer>}
   */
  getTransaction(id: string): Promise<null|Buffer>

  /**
   * Send Transaction
   *
   * @param {Buffer} transaction
   * @param {object} [options]
   * @param {object} [options.allowHighFees=false]
   * @param {object} [options.bypassLimits=false]
   * @returns {Promise<string>}
   */
  sendTransaction(transaction: Buffer, options: Object): Promise<string>;

  /**
   * Returns UTXO for a given address or multiple addresses (max result 1000)
   * @param {string|string[]} address or array of addresses
   * @param {number} [from] - start of range in the ordered list of latest UTXO (optional)
   * @param {number} [to] - end of range in the ordered list of latest UTXO (optional)
   * @param {number} [fromHeight] - which height to start from (optional, overriding from/to)
   * @param {number} [toHeight] - on which height to end (optional, overriding from/to)
   * @returns {Promise<object>} - Object with pagination info and array of unspent outputs
   */
  getUTXO(address: string | string[], from?: number, to?: number, fromHeight?: number, toHeight?: number): Promise<object>;

  /**
   * @param {string} rawIxTransaction - hex-serialized instasend transaction
   * @return {Promise<string>} - transaction id
   */
  sendRawIxTransaction(rawIxTransaction: string): Promise<string>;

  /**
   * Sends serialized transaction to the network
   * @param {string} rawTransaction - hex string representing serialized transaction
   * @returns {Promise<string>} - transaction id
   */
  sendRawTransaction(rawTransaction: string): Promise<string>;

  /**
   * Fetch DAP Objects from DashDrive State View
   * @param {string} contractId
   * @param {string} type - Dap objects type to fetch
   * @param options
   * @param {Object} options.where - Mongo-like query
   * @param {Object} options.orderBy - Mongo-like sort field
   * @param {number} options.limit - how many objects to fetch
   * @param {number} options.startAt - number of objects to skip
   * @param {number} options.startAfter - exclusive skip
   * @return {Promise<Object[]>}
   */
  fetchDocuments(contractId: string, type: string, options: {
    where: any;
    orderBy: any;
    limit: number;
    startAt: number;
    startAfter: number;
  }): Promise<object[]>;

  /**
   * Returns blockchain user by its username or regtx id
   * @param {string} userId - user reg tx id
   * @returns {Promise<Object>} - blockchain user
   */
  getUserById(userId: string): Promise<object>;

  /**
   * Returns blockchain user by its username or regtx id
   * @param {string} username
   * @returns {Promise<Object>} - blockchain user
   */
  getUserByName(username: string): Promise<object>;

  /**
   * Sends serialized state transition header and data packet
   * @param {string} rawStateTransition - hex string representing state transition header
   * @param {string} rawSTPacket - hex string representing state transition data
   * @returns {Promise<string>} - header id
   */
  sendRawTransition(rawStateTransition: string, rawSTPacket: string): Promise<string>;

  /**
   * @param {Object} bloomFilter
   * @param {Uint8Array|string} bloomFilter.vData - The filter itself is simply a bit
   * field of arbitrary byte-aligned size. The maximum size is 36,000 bytes.
   * @param {number} bloomFilter.nHashFuncs - The number of hash functions to use in this filter.
   * The maximum value allowed in this field is 50.
   * @param {number} bloomFilter.nTweak - A random value to add to the seed value in the
   * hash function used by the bloom filter.
   * @param {number} bloomFilter.nFlags - A set of flags that control how matched items
   * are added to the filter.
   * @param {Object} [options]
   * @param {string} [options.fromBlockHash] - Specifies block hash to start syncing from
   * @param {number} [options.fromBlockHeight] - Specifies block height to start syncing from
   * @param {number} [options.count=0] - Number of blocks to sync, if set to 0 syncing is continuously
   * sends new data as well
   * @returns {
   *    Promise<EventEmitter>|!grpc.web.ClientReadableStream<!TransactionsWithProofsResponse>
   * }
   */
  subscribeToTransactionsWithProofs(bloomFilter: {
    vData: Uint8Array | string;
    nHashFuncs: number;
    nTweak: number;
    nFlags: number;
  }, options?: {
    fromBlockHash?: string;
    fromBlockHeight?: number;
    count?: number;
  }): Promise<any>;


  /**
   * Send State Transition to machine
   *
   * @param {AbstractStateTransition} stateTransition
   * @returns {Promise<!ApplyStateTransitionResponse>}
   */
  applyStateTransition(stateTransition: any): Promise<any>

  /**
   * Fetch the identity by id
   *
   * @param {string} id
   * @returns {Promise<!Buffer|null>}
   */
  getIdentity(id: string): Promise<Buffer|null>

  /**
   * Fetch Data Contract by id
   *
   * @param {string} contractId
   * @returns {Promise<Buffer>}
   */
  getDataContract(contractId: string): Promise<Buffer>

  /**
   * Fetch Documents from Drive
   *
   * @param {string} contractId
   * @param {string} type - Dap objects type to fetch
   * @param {object} options
   * @param {object} options.where - Mongo-like query
   * @param {object} options.orderBy - Mongo-like sort field
   * @param {number} options.limit - how many objects to fetch
   * @param {number} options.startAt - number of objects to skip
   * @param {number} options.startAfter - exclusive skip
   * @returns {Promise<Buffer[]>}
   */
  getDocuments(contractId: string, type: string, options: object): Promise<Buffer[]>
  /**
   * Fetch the identity by public key hash
   * @param {string} publicKeyHash
   * @return {Promise<!Buffer|null>}
   */
  getIdentityByFirstPublicKey(publicKeyHash: string): Promise<Buffer|null>
  /**
   * Fetch the identity id by public key hash
   * @param {string} publicKeyHash
   * @return {Promise<!string|null>}
   */
  getIdentityIdByFirstPublicKey(publicKeyHash: string): Promise<String|null>
}
