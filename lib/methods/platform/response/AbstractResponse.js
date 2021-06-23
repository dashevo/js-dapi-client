const Metadata = require('./Metadata');

/**
 * @abstract
 */
class AbstractResponse {
  /**
   * @param {Metadata} metadata
   */
  constructor(metadata) {
    this.metadata = metadata;
  }

  /**
   * @returns {Metadata} - metadata
   */
  getMetadata() {
    return this.metadata;
  }
}

module.exports = AbstractResponse;
