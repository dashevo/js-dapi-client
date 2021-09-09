const GrpcErrorCodes = require('@dashevo/grpc-common/lib/server/error/GrpcErrorCodes');

const NotFoundError = require('./response/NotFoundError');
const InvalidRequestError = require('./request/InvalidRequestError');

const INVALID_REQUEST_CODES = [
  GrpcErrorCodes.INVALID_ARGUMENT,
  GrpcErrorCodes.FAILED_PRECONDITION,
  GrpcErrorCodes.ALREADY_EXISTS,
  GrpcErrorCodes.UNAUTHENTICATED,
  GrpcErrorCodes.OUT_OF_RANGE,
  GrpcErrorCodes.PERMISSION_DENIED,
];

const SERVER_ERROR_CODES = [
  GrpcErrorCodes.RESOURCE_EXHAUSTED,
  GrpcErrorCodes.UNAVAILABLE,
  GrpcErrorCodes.CANCELLED,
  GrpcErrorCodes.UNKNOWN,
  GrpcErrorCodes.DATA_LOSS,
  GrpcErrorCodes.UNIMPLEMENTED,
  GrpcErrorCodes.ABORTED,
  GrpcErrorCodes.INTERNAL,
];

function createTransportError(dapiError, address) {
  const code = dapiError.getCode();

  if (INVALID_REQUEST_CODES.includes(code) || (code >= 1000 && code < 5000)) {
    return new InvalidRequestError(dapiError, address);
  }

  if (SERVER_ERROR_CODES.includes(code)) {
    return new ServerError(dapiError, address);
  }

  if (code === GrpcErrorCodes.NOT_FOUND) {
    return new NotFoundError(dapiError, address);
  }

  if (code === GrpcErrorCodes.DEADLINE_EXCEEDED) {
    return new TimeoutError(dapiError, address);
  }

  return new ResponseError(dapiError, address);
}

module.exports = createTransportError;
