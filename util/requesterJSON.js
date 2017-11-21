const url = require('url');
const http = require('http');
const https = require('https');

const timeout = 10 * 1000; // 60 second timeout (time to get the response)
const { is } = require('khal');

const requesterJSON = {
  prepareRequest(URL) {
    const parseURL = url.parse(URL);
    const {
      port, protocol, hostname, path,
    } = parseURL;
    const fullURL = (protocol === null) ? `http://${URL}` : URL;
    return {
      path, hostname, URL: fullURL, port, requester: (protocol === 'https:') ? https : http,
    };
  },
  get(incomingURL) {
    if (!incomingURL) { throw new Error('Require URL'); }

    return new Promise(((resolve, reject) => {
      const prepare = requesterJSON.prepareRequest(incomingURL);
      const {
        URL, hostname, path, requester, port,
      } = prepare;
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
              if (!is.stringified(rawData)) {
                reject(new Error(`Not JSON - [GET]${URL}`));
              }
              const parsedData = JSON.parse(rawData);
              resolve(parsedData);
            } catch (e) {
              resolve(e.message);
            }
          });
        } else if (statusCode === 302 || statusCode === 301) {
          // Redirection
          const newURL = response.headers.location;
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
  },
  post(options, data) {
    return new Promise(((resolve, reject) => {
      const { host, path = '/', port = 80 } = options;
      // const _hostname = options.host;
      // const _path = options.path || '/';
      // const _port = options.port || 80;
      const req = http;
      const requestData = JSON.stringify(data);

      const postOptions = {
        hostname: host,
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
      const request = req.request(postOptions, (response) => {
        const { statusCode } = response;
        if (statusCode === 200) {
          response.setEncoding('utf8');
          let rawData = '';
          response.on('data', (chunk) => { rawData += chunk; });
          response.on('end', () => {
            try {
              if (!is.stringified(rawData)) {
                reject(new Error(`Not JSON - [POST]${host}`, port, path));
              }
              const parsedData = JSON.parse(rawData);
              resolve(parsedData);
            } catch (e) {
              resolve(e.message);
            }
          });
        } else if (statusCode === 302 || statusCode === 301) {
          // Redirection
          const newURL = response.headers.location;
          // throw("Moved to ",newURL)
          resolve(req.get(newURL));
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
      request.end(requestData);
    }));
  },
};

module.exports = requesterJSON;
