const cbor = require('cbor');
const {
  server: {
    error: {
      InternalGrpcError,
      InvalidArgumentGrpcError,
      DeadlineExceededGrpcError,
      ResourceExhaustedGrpcError,
      NotFoundGrpcError,
      FailedPreconditionGrpcError,
      UnavailableGrpcError,
      GrpcError,
    },
  },
} = require('@dashevo/grpc-common');

const GrpcErrorCodes = require('@dashevo/grpc-common/lib/server/error/GrpcErrorCodes');
const createConsensusError = require('@dashevo/dpp/lib/errors/consensus/createConsensusError');
const AlreadyExistsGrpcError = require('@dashevo/grpc-common/lib/server/error/AlreadyExistsGrpcError');

/**
 * @param {number} code
 * @param {string} message
 * @param {*} data
 *
 * @return {GrpcError}
 */
function createDAPIServerError(code, message, data) {
  // eslint-disable-next-line default-case
  switch (code) {
    case GrpcErrorCodes.INVALID_ARGUMENT:
      return new InvalidArgumentGrpcError(message, data);
    case GrpcErrorCodes.DEADLINE_EXCEEDED:
      return new DeadlineExceededGrpcError(message, data);
    case GrpcErrorCodes.NOT_FOUND:
      return new NotFoundGrpcError(message, data);
    case GrpcErrorCodes.ALREADY_EXISTS:
      return new AlreadyExistsGrpcError(message, data);
    case GrpcErrorCodes.RESOURCE_EXHAUSTED:
      return new ResourceExhaustedGrpcError(message, data);
    case GrpcErrorCodes.FAILED_PRECONDITION:
      return new FailedPreconditionGrpcError(message, data);
    case GrpcErrorCodes.INTERNAL: {
      const error = new Error(message);
      error.stack = data.stack;

      delete data.stack;

      return new InternalGrpcError(error, data);
    }
    case GrpcErrorCodes.UNAVAILABLE:
      return new UnavailableGrpcError(message, data);
    case GrpcErrorCodes.CANCELLED:
    case GrpcErrorCodes.UNKNOWN:
    case GrpcErrorCodes.UNAUTHENTICATED:
    case GrpcErrorCodes.DATA_LOSS:
    case GrpcErrorCodes.UNIMPLEMENTED:
    case GrpcErrorCodes.OUT_OF_RANGE:
    case GrpcErrorCodes.ABORTED:
    case GrpcErrorCodes.PERMISSION_DENIED:
      return new GrpcError(code, message, data);
  }

  if (code >= 17 && code < 1000) {
    return new GrpcError(code, message, data);
  }

  if (code >= 1000 && code < 5000) {
    return createConsensusError(code, data);
  }

  return new InternalGrpcError(new Error(`Unknown error code: ${code}`));
}

module.exports = createDAPIServerError;
