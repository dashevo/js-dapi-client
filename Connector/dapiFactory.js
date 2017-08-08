DAPISDK = () => {
    return {
        Accounts: require('../Accounts/').Accounts(),
        Explorer: require('../Explorer/').Explorer(),
        Discover: require('../Discover/').Discover(),
        _config: require('../config.js')
    }
}

module.exports = DAPISDK