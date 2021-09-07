// в grpc транспорте оборачивать код и сделать такой же класс как и вдапи который делает тоже самое
// grpc, consensus

// response error (dapi address)

class DAPIClientError extends Error {
  constructor(message) {
    super(message);

    this.name = this.constructor.name;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

module.exports = DAPIClientError;
