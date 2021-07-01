const AbstractResponse = require('../response/AbstractResponse');
const Metadata = require('../response/Metadata');

class GetDataContractResponse extends AbstractResponse {
  /**
   * @param {Buffer} [dataContract]
   * @param {Metadata} metadata
   */
  constructor(dataContract, metadata = undefined) {
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
    const metadata = proto.getMetadata() ? new Metadata(proto.getMetadata().toObject()) : undefined;

    return new GetDataContractResponse(
      proto.getDataContract() ? Buffer.from(proto.getDataContract()) : undefined,
      metadata,
    );
  }
}

module.exports = GetDataContractResponse;
