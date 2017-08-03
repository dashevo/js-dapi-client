const has = require('../../util/has.js');
const requesterJSON = require('../../util/requesterJSON.js');
const { uuid } = require('khal');

isPingable = function(el) {

    return new Promise(function(resolve, reject) {
        let uri = el.fullBase + el.insightPath + '/status';
        requesterJSON.get(uri)
            .then(function(resp) {
                if ((resp && resp.hasOwnProperty('info'))) {
                    resolve(el);
                } else {
                    //pvr: some error handling
                }
            })
            .catch(function(err) {
                resolve(null)
                //not pingabe do nothing (perhaps some logging)
            });
    })
};
exports.validate = function(_unValidatedList) {

    return new Promise(function(resolve, reject) {
        Promise.all(_unValidatedList.map(ul => isPingable(ul)))
            .then(validList => {
                resolve(validList.filter(i => i != null))
            })
            .catch(err => {
                console.log(err);
            })
    });
}