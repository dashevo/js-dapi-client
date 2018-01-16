const config = {
  DAPI: {
    port: 6001,
  },
  masternodeUpdateInterval: 60000,
  quorumUpdateInterval: 60000,
  DAPIDNSSeeds: [
    {
      protocol: 'http',
      host: '127.0.0.1',
      port: 6001,
    },
  ],
};

module.exports = config;
