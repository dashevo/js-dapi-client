const interfaces = {
  User: require('./User'),
  Address: require('./Address'),
  Transaction: require('./Transaction'),
  RegSubTx: require('./subscriptionTransactions/RegSubTx'),
  TopUpSubTx: require('./subscriptionTransactions/TopUpSubTx'),
};

module.exports = interfaces;
