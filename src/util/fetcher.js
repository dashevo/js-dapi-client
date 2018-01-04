const requesterJSON = require('./requesterJSON');

const get = (options, callback) => {
  requesterJSON
    .get(options.url)
    .then((result) => {
      callback(null, result);
    })
    .catch((error) => {
      console.error('Error while fetching :', error);
      callback(error, null);
    });
};

const post = (options, callback) => {
  requesterJSON
    .post({ host: options.host, port: options.port, auth: options.auth }, options.data)
    .then((result) => {
      callback(null, result);
    })
    .catch((error) => {
      console.error('Error while fetching :', error);
      callback(error, null);
    });
};

const fetcher = (options, callback) => {
  if (options.type === 'GET') {
    get(options, callback);
  } else if (options.type === 'POST') {
    post(options, callback);
  } else {
    callback('invalid parameter', null);
  }
};

module.exports = {
  fetcher,
};
