const RetriableResponseError = require('./RetriableResponseError');

class TimeoutError extends RetriableResponseError {

}

module.exports = TimeoutError;
