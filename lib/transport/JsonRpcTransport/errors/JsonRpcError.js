class JsonRpcError extends Error {
  /**
   * @param {object} requestInfo
   * @param {string} requestInfo.host
   * @param {number} requestInfo.port
   * @param {string} requestInfo.method
   * @param {object} requestInfo.params
   * @param {object} requestInfo.options
   * @param {object} jsonRpcError
   * @param {number} jsonRpcError.code
   * @param {string} jsonRpcError.message
   * @param {object} jsonRpcError.data
   */
  constructor(requestInfo, jsonRpcError) {
    super(`DAPI JSON RPC error: ${requestInfo.method} - ${jsonRpcError.message}`);

    this.name = this.constructor.name;
    this.requestInfo = requestInfo;
    this.errorCode = jsonRpcError.code;
    this.errorMessage = jsonRpcError.message;
    this.errorData = jsonRpcError.data;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * @returns {{host: string, port: number, method: string, params: object, options: object}}
   */
  getRequestInfo() {
    return this.requestInfo;
  }

  /**
   * Get error message
   *
   * @returns {object}
   */
  getErrorMessage() {
    return this.errorMessage;
  }

  /**
   * Get error data
   *
   * @returns {object}
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
