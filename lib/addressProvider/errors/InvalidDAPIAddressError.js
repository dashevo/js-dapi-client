const DAPIClientError = require('../../errors/DAPIClientError');

class InvalidDAPIAddressError extends DAPIClientError {
  /**
   * @param {string} invalidSegment
   */
  constructor(invalidSegment) {
    super(`Invalid address '${invalidSegment}'`);

    this.invalidSegment = invalidSegment;
  }

  /**
   * @returns {string}
   */
  getInvalidSegment() {
    return this.invalidSegment;
  }
}

module.exports = InvalidDAPIAddressError;
