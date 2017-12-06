const { Transaction: BitcoreTransaction } = require('bitcore-lib-dash');
const { transactionApi } = require('../api');

class Transaction extends BitcoreTransaction {
  async send() {
    await transactionApi.sendRawTransaction(this.serialize());
  }
}

module.exports = Transaction;

