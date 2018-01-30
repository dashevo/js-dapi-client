const { Transaction: BitcoreTransaction } = require('bitcore-lib-dash');
const { transaction } = require('../api');

class Transaction extends BitcoreTransaction {
  async send() {
    return transaction.sendRaw(this.serialize());
  }
}

module.exports = Transaction;

