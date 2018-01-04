// TODO: Make this file pass linting!
// Choose a random socket.io endpoint to connect
const { math } = require('khal');

exports.getSocketCandidate = function () {
  const self = this;
  return async function () {
    const args = arguments;
    return new Promise((async (resolve, reject) => {
      if (self.Discover._state !== 'ready') {
        await self.Discover.init();
        return resolve(self.Discover.getConnectorCandidate.apply(null, args));
      }

      const validMNList = self.Discover.Masternode.validMNList;
      if (validMNList && validMNList.length > 0) {
        // Select randomnly one of them
        const selectedMNIdx = math.randomBetweenMinAndMax(0, validMNList.length - 1);
        const el = validMNList[selectedMNIdx];
        const socketPath = `${el.fullBase}`;
        return resolve({ URI: socketPath, idx: selectedMNIdx });
      }
      throw new Error('No MN found :( Sadness & emptyness');
      return resolve(false);
    }));
  };
};
