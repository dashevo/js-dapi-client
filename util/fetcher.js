
const requesterJSON = require('./requesterJSON');

const Fetcher = {
  _fetch(opts, cb) {
    const _GET = function (opts, cb) {
      requesterJSON
        .get(opts.url)
        .then((r) => {
          cb(null, r);
        })
        .catch((e) => {
          console.error('Error while fetching :', e);
          cb(e, null);
        });
    };
    const _POST = function (opts, cb) {
      requesterJSON
        .post({ host: opts.host, port: opts.port, auth: opts.auth }, opts.data)
        .then((r) => {
          cb(null, r);
        })
        .catch((e) => {
          console.error('Error while fetching :', e);
          cb(e, null);
        });
    };
    const self = this;
    if (opts.type) {
      if (opts.type == 'GET') {
        _GET(opts, cb);
      }
      if (opts.type == 'POST') {
        _POST(opts, cb);
      }
    } else {
      cb('missing parameter', null);
    }
  },
};
module.exports = Fetcher;
