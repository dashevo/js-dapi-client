const requesterJSON = require('./requesterJSON');

const get = (options, callback) => {
  requesterJSON
    .get(options.url)
    .then((r) => {
      callback(null, r);
    })
    .catch((e) => {
      console.error('Error while fetching :', e);
      callback(e, null);
    });
};

const post = (options, callback) => {
  requesterJSON
    .post({ host: options.host, port: options.port, auth: options.auth }, options.data)
    .then((r) => {
      callback(null, r);
    })
    .catch((e) => {
      console.error('Error while fetching :', e);
      callback(e, null);
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
