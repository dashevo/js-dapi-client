const AbstractTransportError = require('./AbstractTransportError');

class NoAvailableAddressesError extends AbstractTransportError {
  constructor() {
    super('No available addresses');
  }
}

module.exports = NoAvailableAddressesError;
