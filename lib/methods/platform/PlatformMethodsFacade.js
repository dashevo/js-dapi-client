const broadcastStateTransitionFactory = require('./broadcastStateTransitionFactory');
const getDataContractFactory = require('./getDataContractFactory');
const getDocumentsFactory = require('./getDocumentsFactory');
const getIdentityByPublicKeyHashFactory = require('./getIdentityByPublicKeyHashFactory');
const getIdentityFactory = require('./getIdentityFactory');
const getIdentityIdByPublicKeyHashFactory = require('./getIdentityIdByPublicKeyHashFactory');

class PlatformMethodsFacade {
  /**
   * @param {GrpcTransport} grpcTransport
   */
  constructor(grpcTransport) {
    this.broadcastStateTransition = broadcastStateTransitionFactory(grpcTransport);
    this.getDataContract = getDataContractFactory(grpcTransport);
    this.getDocuments = getDocumentsFactory(grpcTransport);
    this.getIdentityByFirstPublicKey = getIdentityByPublicKeyHashFactory(grpcTransport);
    this.getIdentityByPublicKeyHash = getIdentityByPublicKeyHashFactory(grpcTransport);
    this.getIdentity = getIdentityFactory(grpcTransport);
    this.getIdentityIdByFirstPublicKey = getIdentityIdByPublicKeyHashFactory(grpcTransport);
    this.getIdentityIdByPublicKeyHash = getIdentityIdByPublicKeyHashFactory(grpcTransport);
  }
}

module.exports = PlatformMethodsFacade;
