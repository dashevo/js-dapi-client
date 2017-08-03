DAPISDK = () => {
    return {
        Accounts: require('../Accounts/').Accounts(),
        Explorer: require('../Explorer/').Explorer(),
        Discover: require('../Discover/').Discover(),
        Blockchain: require('../Blockchain/').Blockchain(),
        BWS: require('../BWS/').BWS(),
        _config: require('../config.js')
    }
}

module.exports = DAPISDK