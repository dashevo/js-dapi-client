const url = require('url');
const http = require('http');
const https = require('https');

const requesterJSON = require('./requesterJSON');

const timeout = 10 * 1000;// 60 second timeout (time to get the response)

const prepareRequest = (incomingUrl) => {
  const parseURL = url.parse(incomingUrl);
  const {
    port, protocol, hostname, path,
  } = parseURL;
  const URL = (protocol === null) ? `http://${incomingUrl}` : incomingUrl;
  const requester = protocol === 'https:' ? https : http;
  return {
    path, hostname, URL, port, requester,
  };
};

const get = (incomingUrl) => {
  if (!incomingUrl) {
    throw new Error('Require URL');
  }

  return new Promise(((resolve, reject) => {
    const preparedRequest = requesterJSON.prepareRequest(incomingUrl);
    const {
      hostname, path, requester, port,
    } = preparedRequest;
    const getOptions = {
      hostname,
      path,
      port,
      method: 'GET',
    };
    const request = requester.request(getOptions, (response) => {
      const { statusCode } = response;
      if (statusCode === 200) {
        response.setEncoding('utf8');
        let rawData = '';
        response.on('data', (chunk) => { rawData += chunk; });
        response.on('end', () => {
          try {
            resolve(rawData);
          } catch (e) {
            resolve(e.message);
          }
        });
      } else if (statusCode === 302 || statusCode === 301) {
        // Redirection
        const newURL = response.headers.location;
        console.log('Redirect to', newURL);
        // throw("Moved to ",newURL)
        resolve(requester.get(newURL));
      } else if (statusCode === 404) {
        // throw("Unreachable domain", statusCode);
        resolve(statusCode);
      } else {
        // throw("Got an statusCode", statusCode);
        resolve(statusCode);
      }
    })
      .on('error', e => reject(e));
    request.setTimeout(timeout, () => {
      request.abort();
      // Gateway time-out
      resolve(504);
    });
    request.end();
  }));
};

const post = (options, data) => new Promise(((resolve, reject) => {
  const { host: hostname, path = '/', port = 80 } = options;
  // const _path = options.path || '/';
  // const _port = options.port || 80;
  const requester = http;
  const requestData = data;

  const postOptions = {
    hostname,
    path,
    port,
    method: 'POST',
    headers: {
      'Content-Length': requestData.length,
    },
  };
  if (options.auth) {
    postOptions.auth = (options.auth);
  }
  const request = requester.request(postOptions, (response) => {
    const { statusCode } = response;
    if (statusCode === 200) {
      response.setEncoding('utf8');
      let rawData = '';
      response.on('data', (chunk) => { rawData += chunk; });
      response.on('end', () => {
        try {
          resolve(rawData);
        } catch (e) {
          resolve(e.message);
        }
      });
    } else if (statusCode === 302 || statusCode === 301) {
      // Redirection
      const newURL = response.headers.location;
      console.log('Redirect to', newURL);
      // throw("Moved to ",newURL)
      resolve(requester.get(newURL));
    } else if (statusCode === 404) {
      // throw("Unreachable domain", statusCode);
      resolve(statusCode);
    } else {
      // throw("Got an statusCode", statusCode);
      resolve(statusCode);
    }
  })
    .on('error', e => reject(e));
  request.setTimeout(timeout, () => {
    request.abort();
    // Gateway time-out
    return resolve(504);
  });
  request.end(requestData);
}));

module.exports = {
  prepareRequest,
  get,
  post,
};
