const {
  v0: {
    GetConsensusParamsResponse,
    ConsensusParamsBlock,
    ConsensusParamsEvidence,
  },
} = require('@dashevo/dapi-grpc');
const GetConsensusParamsResponseClass = require('../../../../../lib/methods/platform/getConsensusParams/getConsensusParamsResponse');
const InvalidResponseError = require('../../../../../lib/methods/platform/response/errors/InvalidResponseError');

describe('getConsensusParamsResponse', () => {
  let getConsensusParamsResponse;
  let consensusParamsFixture;

  beforeEach(() => {
    consensusParamsFixture = {
      block: {
        timeIotaMs: 1000,
        maxGas: -1,
        maxBytes: 22020103,
      },
      evidence: {
        maxAgeNumBlocks: 100007,
        maxAgeDuration: 172807000000007,
        maxBytes: 1048583,
      },
    };

    getConsensusParamsResponse = new GetConsensusParamsResponseClass(
      consensusParamsFixture.block,
      consensusParamsFixture.evidence,
    );
  });

  it('should return block', () => {
    const block = getConsensusParamsResponse.getBlock();

    expect(block).to.deep.equal(consensusParamsFixture.block);
  });

  it('should return evidence', () => {
    const evidence = getConsensusParamsResponse.getEvidence();

    expect(evidence).to.deep.equal(consensusParamsFixture.evidence);
  });

  it('should create an instance from proto', () => {
    const block = new ConsensusParamsBlock();
    block.setMaxBytes(consensusParamsFixture.block.maxBytes);
    block.setMaxGas(consensusParamsFixture.block.maxGas);
    block.setTimeIotaMs(consensusParamsFixture.block.timeIotaMs);

    const evidence = new ConsensusParamsEvidence();
    evidence.setMaxAgeNumBlocks(consensusParamsFixture.evidence.maxAgeNumBlocks);
    evidence.setMaxAgeDuration(consensusParamsFixture.evidence.maxAgeDuration);
    evidence.setMaxBytes(consensusParamsFixture.evidence.maxBytes);

    const proto = new GetConsensusParamsResponse();
    proto.setBlock(block);
    proto.setEvidence(evidence);

    getConsensusParamsResponse = GetConsensusParamsResponseClass.createFromProto(proto);

    expect(getConsensusParamsResponse.getBlock()).to.deep.equal(consensusParamsFixture.block);
    expect(getConsensusParamsResponse.getEvidence()).to.deep.equal(consensusParamsFixture.evidence);
  });

  it('should return InvalidResponseError if consensus params are not defined', () => {
    const proto = new GetConsensusParamsResponse();

    try {
      getConsensusParamsResponse = GetConsensusParamsResponseClass.createFromProto(proto);

      expect.fail('should throw InvalidResponseError');
    } catch (e) {
      expect(e).to.be.an.instanceOf(InvalidResponseError);
    }
  });
});
