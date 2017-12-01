const API = require('./BaseAPI');

class TransactionApi extends API {

  async sendRawTransaction(rawTransaction) {
    return this.makePostRequest(`/tx/send`, { rawtx: rawTransaction });
  }

}

module.exports = TransactionApi;