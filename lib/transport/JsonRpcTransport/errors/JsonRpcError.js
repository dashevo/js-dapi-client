class JsonRpcError extends Error {
  /**
   * @param {Object} requestInfo
   * @param {string} requestInfo.host
   * @param {number} requestInfo.port
   * @param {string} requestInfo.method
   * @param {Object} requestInfo.params
   * @param {Object} requestInfo.options
   * @param {Object} jsonRpcError
   * @param {number} jsonRpcError.code
   * @param {string} jsonRpcError.message
   * @param {Object} jsonRpcError.data
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
