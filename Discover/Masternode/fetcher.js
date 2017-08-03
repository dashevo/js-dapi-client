const has = require('../../util/has.js');
const { uuid } = require('khal');

getNodes = function() {
    //todo
    //read from local storage
    //if none return config defaults

    return SDK._config.useInsight ? SDK._config.DISCOVER.INSIGHT_SEEDS : SDK._config.DISCOVER.DAPI_SEEDS
}

exports.fetcher = function() {

    return SDK.Discover.Masternode.validate(
        getNodes().map(n => {
            return {
                protocol: n.protocol,
                port: n.port,
                base: n.base,
                fullBase: `${n.protocol}://${n.base}:${n.port}`,
                insightPath: n.path,
                socketPath: 'socket.io/?transport=websocket'
            }
        })
    );
}