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
    const metadata = proto.getMetadata() ? new Metadata(proto.getMetadata().toObject()) : null;

    return new GetDataContractResponse(
      metadata,
      proto.getDataContract() ? Buffer.from(proto.getDataContract()) : undefined,
    );
  }
}

module.exports = GetDataContractResponse;
