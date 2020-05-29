const DAPIClientError = require('../../errors/DAPIClientError');

class DAPIAddressHostMissingError extends DAPIClientError {
  /**
   * @param {string} invalidSegment
   */
  constructor(invalidSegment) {
    super(`DAPI address '${invalidSegment}'`);

    this.invalidSegment = invalidSegment;
  }

  /**
   * @returns {string}
   */
  getInvalidSegment() {
    return this.invalidSegment;
  }
}

module.exports = DAPIAddressHostMissingError;
