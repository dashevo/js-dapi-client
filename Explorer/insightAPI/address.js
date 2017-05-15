const axios = require('axios');

exports.getBalance = function() {
    let self = this;
    return async function(){
        return new Promise(async function (resolve, reject) {
            let getInsightCandidate = await self.Discover.getInsightCandidate();
            let getInsightURI = getInsightCandidate.URI;
            let url = `${getInsightURI}/addr/yj6xVHMyZGBdLqGUfoGc9gDvU8tHx6iqb4/balance`;
            return axios
              .get(url)
              .then(function(response){
                console.log(url, response.data)
                return resolve(response.data);
              })
              .catch(function(error){
                if(error){
                    console.log(url, error)
                    console.error(`An error was triggered while fetching address ${'XfmtHzRb8TLGpE3z3bV9iMXr7N8UbNsLfk'} `);
                    return resolve(false);
                }
            });
        });
    }
}

exports.getUTXO = function() {
    let self = this;
    return async function(){
        return new Promise(async function (resolve, reject) {
            let getInsightCandidate = await self.Discover.getInsightCandidate();
            let getInsightURI = getInsightCandidate.URI;
            let url = `${getInsightURI}/addr/yj6xVHMyZGBdLqGUfoGc9gDvU8tHx6iqb4/utxo`;
            return axios
              .get(url)
              .then(function(response){
                return resolve(response.data);
              })
              .catch(function(error){
                if(error){
                    console.log(url, error)
                    console.error(`An error was triggered while fetching address ${'XfmtHzRb8TLGpE3z3bV9iMXr7N8UbNsLfk'} `);
                    return resolve(false);
                }
            });
        });
    }
}
