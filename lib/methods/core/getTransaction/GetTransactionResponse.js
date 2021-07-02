class GetTransactionResponse {
  /**
   *
   * @param {Object} properties
   * @param {Buffer} properties.transaction
   * @param {Buffer} properties.blockHash
   * @param {number} properties.height
   * @param {number} properties.confirmations
   * @param {boolean} properties.isInstantLocked
   * @param {boolean} properties.isChainLocked
   */
  constructor(properties) {
    this.transaction = properties.transaction;
    this.blockHash = properties.blockHash;
    this.height = properties.height;
    this.confirmations = properties.confirmations;
    this.instantLocked = properties.isInstantLocked;
    this.chainLocked = properties.isChainLocked;
  }

  static createFromProto(proto) {



    return new GetTransactionResponse({

    })

    const transactionBinaryArray = response.getTransaction();

    let transaction = null;
    if (transactionBinaryArray) {
      transaction = Buffer.from(transactionBinaryArray);
    }

    return transaction;
  }
}

module.exports = GetTransactionResponse;
