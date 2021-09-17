const grpcErrorCodes = require('@dashevo/grpc-common/lib/server/error/GrpcErrorCodes');

const RetriableResponseError = require('../../errors/response/RetriableResponseError');

class TimeoutError extends RetriableResponseError {
  /**
   * @param {string} message
   * @param {Object} data
   * @param {DAPIAddress} dapiAddress
   */
  constructor(message, data, dapiAddress) {
    super(grpcErrorCodes.NOT_FOUND, message, data, dapiAddress);
  }
}

module.exports = TimeoutError;
