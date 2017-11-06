/* eslint-disable no-underscore-dangle */
// TODO: The implementation needs to be in line with Airbnb rules of not using dangling underscores

const has = require('../../util/has.js');
const { uuid } = require('khal');

const send = query =>
  new Promise(((resolve, reject) => {
    const res = { error: null, result: 'success' };

    if (query && has(query, 'type')) {
      switch (query.type) {
        case 'friendRequest': {
          const msg = {
            type: 'user',
            action: 'friendRequest',
            user: this.USER._id,
            params: {
              action: 'send',
              to: query._id,
            },
            _reqId: uuid.generate.v4(),
          };
          this.socket.send(JSON.stringify(msg));
          break;
        }
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

module.exports = { send };
