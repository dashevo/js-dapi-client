const Config = {
    useInsight: false, // bypass dapi and access insight methods directly
    DISCOVER: {
        INSIGHT_SEEDS: [
            /*{
                protocol:"https",
                path:'/api',
                base:"insight.dash.siampm.com",
                port: 80,
                fullPath:"https://insight.dash.siampm.com/api"
            }*/
        ],
        DAPI_SEEDS: [
            {
                protocol: "http",
                path: '',
                base: "localhost",
                port: 3000,
                fullPath: "http://localhost:3000/api"
            }
        ],
        SOCKET_SEEDS: {
            /*ipv6: [
                {uri: "::", port: 80}
            ]*/
        }
    },
    ROUTER: {
        port: 80,
        host: '::'//Allow ipv6
    },
    debug: false,
    verbose: false,
    warnings: false,
    errors: false
};
module.exports = Config;