//Choose a random insight uri
const { math } = require('khal');

exports.getConnectorCandidate = function() {

    return new Promise(function(resolve, reject) {

        if (SDK.Discover._state !== "ready") {
            SDK.Discover.init()
                .then(isSuccess => {
                    resolve(SDK.Discover.Masternode.validMNList);
                })
                .catch(e => {
                    console.log(e)
                })
        }
        else {
            resolve(SDK.Discover.Masternode.validMNList);
        }
    }).then(validMNList => {
        if (validMNList && validMNList.length > 0) {
            //Select randomnly one of them
            let selectedMNIdx = math.randomBetweenMinAndMax(0, validMNList.length - 1);
            let el = validMNList[selectedMNIdx];
            return { URI: el.fullBase + el.connectorPath, idx: selectedMNIdx };
        } else {
            console.log('No MN found :( Sadness & emptyness');
        }
    }).catch(err => {
        console.log(err);
    })
    // throw new Error('Discover need to be init first');
}