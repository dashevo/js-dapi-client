const axios = require('axios'),
    SpvUtils = require('../../util/SpvUtils'),
    _ = require('lodash'),
    fs = require('fs')


getStoredMasternodes = () => {
    return new Promise((resolve, reject) => {
        let path = './masterNodeList.dat' //move to config

        if (fs.existsSync(path)) {
            resolve(fs.readFileSync());
        }
        else {
            resolve(null);
        }

        //todo: filter out old/outdated mastnernodes & some other logic?
    })
}

//Return a random uri from any in provided list of mns (or seeds if no mns provided)
getUri = (mns) => {
    let canditate = _.sample(mns || SDK._config.DISCOVER.DAPI_SEEDS)
    return `${canditate.protocol}://${canditate.base}:${canditate.port}`
}

getMnLists = (mns) => {

    return new Promise((resolve, reject) => {

        return axios.get(`${getUri(mns)}/masternodes/updateList/${SDK.Discover.Masternode.masternodeList.hash}`)
            .then(res => {
                resolve(res.data);
            })
            .catch(err => {
                console.log(err);
            })
    })

}

exports.fetcher = (mns) => {
    return new Promise((resolve, reject) => {
        getStoredMasternodes()
            .then(stroredMns => {
                if (mns) {
                    resolve(stroredMns);
                }
                else {
                    return getMnLists(mns)
                }
            })

            //Todo: Implement finding mnList on longest chain once dips has been finalised
            // .then(mnLists => {
            //     return SpvUtils.getMnListOnLongestChain(mnLists);
            // })
            // .then(bestMnList => {
            //     return SpvUtils.getSpvValidMns(bestMnList);
            // })

            .then(validMnList => {
                if (validMnList) {
                    resolve(validMnList);
                }
                else {
                    reject('No valid MN found');
                }
            })
            .catch(err => console.log(err))
    })
}