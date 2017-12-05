const AddressAPI = require('./AddressAPI');
const UserAPI = require('./UserAPI');
const TransactionAPI = require('./TransactionAPI');

const api = {
  addressApi: new AddressAPI(),
  userApi: new UserAPI(),
  transactionApi: new TransactionAPI(),
};

module.exports = api;
