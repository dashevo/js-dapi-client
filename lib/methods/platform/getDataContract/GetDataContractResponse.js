const AbstractResponse = require('../response/AbstractResponse');
const Metadata = require('../response/Metadata');

class GetDataContractResponse extends AbstractResponse {
  /**
   * @param {Metadata} metadata
   * @param {Buffer} [dataContract]
   */
  constructor(metadata, dataContract = undefined) {
    super(metadata);

    this.dataContract = dataContract;
  }

  /**
   * @returns {Buffer}
   */
  getDataContract() {
    return this.dataContract;
  }

  /**
   * @param proto
   * @return {GetDataContractResponse}
   */
  static createFromProto(proto) {
    return new GetDataContractResponse(
      new Metadata(proto.getMetadata().toObject()),
      proto.getDataContract() ? Buffer.from(proto.getDataContract()) : undefined,
    );
  }
}

module.exports = GetDataContractResponse;
