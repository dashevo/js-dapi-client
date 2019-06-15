class RPCError extends Error {
  constructor(message, data) {
    super();

    this.message = message;
    this.data = data;
    this.name = this.constructor.name;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * @return {string}
   */
  getErrorData() {
    return this.data;
  }
}

module.exports = RPCError;
