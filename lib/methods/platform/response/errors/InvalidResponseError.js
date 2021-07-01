class InvalidResponseError extends Error {
  constructor(message) {
    super(`Invalid response: ${message}`);

    this.name = this.constructor.name;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

module.exports = InvalidResponseError;
