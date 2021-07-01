class InvalidResponseError extends Error {
  constructor() {
    super('Invalid response');

    this.name = this.constructor.name;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

module.exports = InvalidResponseError;
