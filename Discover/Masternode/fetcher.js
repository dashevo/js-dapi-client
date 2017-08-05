const axios = require('axios'),
    SpvUtils = require('../../util/SpvUtils'),
    _ = require('underscore'),
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

getSeedUris = () => {
    return SDK._config.DISCOVER.INSIGHT_SEEDS
        .map(n => {
            return `${n.protocol}://${n.base}:${n.port}`
        })
}

getMnListsFromSeeds = () => {

    let mockMnList = [
        { mn1: {} },
        { mn2: {} },
        { mn3: {} }
    ]

    return new Promise((resolve, reject) => {
        Promise.all(getSeedUris().map(uri => {
            return mockMnList; //axios.get($`uri/api/GetMnLists`) not yet available from insight servers
        }))
            .then(mnLists => {
                resolve(mnLists)
            })
            .catch(err => {
                console.log(err)
            })
    })

}

chooseRandomMns = (mnLists) => {
    return mnLists.map(mnList => {
        return _.sample(mnList, Math.round(mnCount / mnLists.length));
    })
}

const mnCount = 10; //random number of mns to connect to (move to config)
exports.fetcher = () => {
    return new Promise((resolve, reject) => {
        getStoredMasternodes()
            .then(mns => {
                if (mns) {
                    resolve(mns);
                }
                else {
                    return getMnListsFromSeeds()
                }
            })
            .then(mnLists => {
                return SpvUtils.getMnOnLongestChain(chooseRandomMns(mnLists))
            })
            .then(mnListOnLongestChain => {
                return SpvUtils.getSpvValidMn(mnListOnLongestChain)
            })
            .then(validMn => {
                if (validMn) {
                    resolve(validMn)
                }
                else {
                    reject('No valid MN found')
                }
            })
            .catch(err => console.log(err))
    })
}