const has = require('../../util/has.js');
const { uuid } = require('khal');

exports.remove = function (query) {
  return new Promise(((resolve, reject) => {
    const res = {};
    console.log(query);
    resolve(true);
  }));
};
