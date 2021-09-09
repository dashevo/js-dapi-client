const ResponseError = require('./ResponseError');

class RetriableResponseError extends ResponseError {
  // eslint-disable-next-line no-unused-vars
  doRetry(options) {
    return true;
  }
}

module.exports = RetriableResponseError;
