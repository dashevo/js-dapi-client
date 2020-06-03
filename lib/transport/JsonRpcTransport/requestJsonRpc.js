const axios = require('axios');

const JsonRpcError = require('./errors/JsonRpcError');

/**
 * @typedef {requestJsonRpc}
 * @param {string} host
 * @param {number} port
 * @param {string} method
 * @param {object} params
 * @param {object} [options]
 * @returns {Promise<*>}
 */
async function requestJsonRpc(host, port, method, params, options = {}) {
  const protocol = port === 443 ? 'https' : 'http';

  const url = `${protocol}://${host}:${port && port !== 443 ? port : ''}`;

  const payload = {
    jsonrpc: '2.0',
    method,
    params,
    id: 1,
  };

  const response = await axios.post(
    url,
    payload,
    { timeout: options.timeout },
  );

  if (response.status !== 200) {
    // noinspection JSUnresolvedVariable
    throw new Error(response.statusMessage);
  }

  const { data } = response;

  if (data.error) {
    const requestInfo = {
      host,
      port,
      method,
      params,
      options,
    };

    throw new JsonRpcError(requestInfo, data.error);
  }

  return data.result;
}

module.exports = requestJsonRpc;
