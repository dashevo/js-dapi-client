const has = require('../../util/has.js');
const { uuid } = require('khal');

exports.send = function (query) {
  const self = this;

  return new Promise(((resolve, reject) => {
    const res = { error: null, result: 'success' };

    if (query && has(query, 'type')) {
      switch (query.type) {
        case 'friendRequest':
          const msg = {
            type: 'user',
            action: 'friendRequest',
            user: self.USER._id,
            params: {
              action: 'send',
              to: query._id,
            },
            _reqId: uuid.generate.v4(),
          };
          self.socket.send(JSON.stringify(msg));
          break;
        default:
          res.error = '100 - Missing Params';
          res.result = 'Missing Query';
          reject(res);
          break;
      }
    } else {
      res.error = '100 - Missing Params';
      res.result = 'Missing Query';
      resolve(res);
    }
  }));
};
