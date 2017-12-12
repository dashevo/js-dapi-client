/* eslint-disable */
// TODO: Make this file pass linting!
const Masternode = function () {
  const self = this;
  return {
    fetcher: require('./fetcher').fetcher,
    validate: require('./validate').validate,
  };
};

exports.Masternode = Masternode;
