class JsonRpcError extends Error {
  /**
   * @param {Object} requestInfo
   * @param {string} requestInfo.host
   * @param {number} requestInfo.port
   * @param {string} requestInfo.method
   * @param {Object} requestInfo.params
   * @param {Object} requestInfo.options
   * @param {number} errorCode
   * @param {string} errorMessage
   * @param {Object} [errorData]
   */
  constructor(requestInfo, errorCode, errorMessage, errorData = {}) {
    super(`DAPI JSON RPC error: ${requestInfo.method} - ${errorMessage}`);

    this.name = this.constructor.name;
    this.requestInfo = requestInfo;
    this.errorCode = errorCode;
    this.errorMessage = errorMessage;
    this.errorData = errorData;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * @return {{host: string, port: number, method: string, params: Object, options: Object}}
   */
  getRequestInfo() {
    return this.requestInfo;
  }

  /**
   * Get error message
   *
   * @return {Object}
   */
  getErrorMessage() {
    return this.errorMessage;
  }

  /**
   * Get error data
   *
   * @return {Object}
   */
  getErrorData() {
    return this.errorData;
  }

  /**
   * Get original error code
   *
   * @returns {number}
   */
  getErrorCode() {
    return this.errorCode;
  }
}

module.exports = JsonRpcError;
