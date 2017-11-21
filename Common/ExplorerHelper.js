/* eslint-disable no-underscore-dangle */
// TODO: Fix implementation to not use dangling underscores
const axios = require('axios');

const explorerPost = (apiMethod, data, SDK) =>
  new Promise(((resolve, reject) => {
    SDK.Discover.getConnectorCandidateURI()
      .then((uri) => {
        const completeUri = uri + apiMethod;
        if (SDK._config.debug) {
          console.log(`[EXPLORER][POST] ${uri}`);
        }
        return axios.post(completeUri, data);
      })
      .then((response) => {
        resolve(response.data);
      })
      .catch((error) => {
        reject(error);
      });
  }));

const explorerGet = (apiMethod, SDK) =>
  new Promise(((resolve, reject) => {
    SDK.Discover.getConnectorCandidateURI()
      .then((uri) => {
        const completeUri = uri + apiMethod;
        if (SDK._config.debug) {
          console.log(`[EXPLORER][GET] ${completeUri}`);
        }
        return axios.get(completeUri);
      })
      .then((response) => {
        resolve(response.data);
      })
      .catch((error) => {
        reject(error);
      });
  }));

module.exports = {
  explorerGet,
  explorerPost,
};
