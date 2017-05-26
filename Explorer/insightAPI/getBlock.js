const _fetch = require('../../util/fetcher.js')._fetch;
const axios = require('axios');

exports.getBlock = function(identifier) {

    return new Promise(function(resolve, reject) {

        var p = [SDK.Discover.getInsightCandidate()];
        if (Number.isInteger(identifier)) {
            p.push(SDK.Explorer.API.getHashFromHeight(identifier));
        }

        Promise.all(p)
            .then(([insightCandidate, derivedHash]) => {
                return axios
                    .get(`${insightCandidate.URI}/block/${derivedHash || identifier}`)
                    .then(function(response) {
                        if (response.hasOwnProperty('data'))
                            resolve(response.data);
                        else
                            reject("Unexpected Response: Got " + response);
                    })
                    .catch(function(error) {
                        //TODO : Signaling + removal feat
                        reject(`An error was triggered while fetching candidate ${getInsightCandidate.idx} - signaling and removing from list`);
                    });
            });
    });
}