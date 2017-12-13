/* eslint-disable no-underscore-dangle */
// TODO: Fix implementation to not use dangling underscores
const axios = require('axios');

// Temporary thing to access local dapi
const discover = {
  async getConnectorCandidateURI() {
    return 'http://127.0.0.1:3000';
  },
};

const explorerPost = (apiMethod, data) =>
  new Promise(((resolve, reject) => {
    discover.getConnectorCandidateURI()
      .then((uri) => {
        const completeUri = uri + apiMethod;
        // if (SDK._config.debug) {
        //   console.log(`[EXPLORER][POST] ${uri}`);
        // }
        return axios.post(completeUri, data);
      })
      .then((response) => {
        resolve(response.data);
      })
      .catch((error) => {
        reject(error);
      });
  }));

const explorerGet = (apiMethod) =>
  new Promise(((resolve, reject) => {
    discover.getConnectorCandidateURI()
      .then((uri) => {
        const completeUri = uri + apiMethod;
        // if (SDK._config.debug) {
        //   console.log(`[EXPLORER][GET] ${completeUri}`);
        // }
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
