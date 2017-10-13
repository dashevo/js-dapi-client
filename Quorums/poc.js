const _config = require('../config')

const REFSDK = _config.useTrustedServer ? require('../Connector/trustedFactory.js') : require('../Connector/dapiFactory.js');

const options = { //no effect for dapi - using defaults
    verbose: false,
    errors: false,
    warnings: false,
    debug: false,
    DISCOVER: {
        INSIGHT_SEEDS: [
            /*{
                protocol: 'http',
                path: "insight-api-dash",
                base: "51.15.5.18",
                port: 3001
            },*/
            {
                protocol: 'https',
                path: "/insight-api-dash",
                base: "dev-test.dash.org",
                port: 443
            }
        ]
    }
};

REFSDK(options)
    .then(ready => {
        if (ready) {
            SDK.Explorer.API.getLastBlockHeight()
                .then(h => {
                    console.log(h);
                })
        }
        else {
            console.log("SDK not initialised")
        }
    })
