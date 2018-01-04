/* eslint-disable */
// TODO: Make this file pass linting!
const axios = require('axios');

exports.estimateFees = function () {
  const self = this;
  return async function (blockNumber) {
    return new Promise((async (resolve, reject) => {
      // let getConnectorCandidate = await self.Discover.getConnectorCandidate(); todo
      const getInsightURI = getConnectorCandidate.URI;
      const url = `${getInsightURI}/utils/estimatefee?nbBlocks=${blockNumber || 2}`;
      return axios
        .get(url)
        .then((response) => {
          console.log(url, response.data);
          return resolve(response.data);
        })
        .catch((error) => {
          if (error) {
            console.log(url, error);
            console.error('An error was triggered getting fee estimates ');
            return resolve(false);
          }
        });
    }));
  };
};
