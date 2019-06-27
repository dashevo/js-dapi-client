# DAPI Client

[![Build Status](https://travis-ci.com/dashevo/dapi-client.svg?branch=master)](https://travis-ci.com/dashevo/dapi-client)
![GitHub release](https://img.shields.io/github/release/dashevo/dapi-client.svg)
![npm](https://img.shields.io/npm/v/@dashevo/dapi-client.svg)

> Client library used to access Dash DAPI endpoints

This library enables HTTP-based interaction with the Dash blockchain and Dash
Platform via the decentralized API ([DAPI](https://github.com/dashevo/dapi))
hosted on Dash masternodes.

 - `DAPI-Client` provides automatic server (masternode) discovery using either a default seed node or a user-supplied one
 - `DAPI-Client` maps to DAPI's [RPC](https://github.com/dashevo/dapi/tree/master/lib/rpcServer/commands) and [gRPC](https://github.com/dashevo/dapi/tree/master/lib/grpcServer/handlers) endpoints

## Table of Contents
- [Install](#install)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## Install

```sh
npm install @dashevo/dapi-client
```

## Usage

```javascript
const DAPIClient = require('@dashevo/dapi-client');
var client = new DAPIClient();

client.getBalance('testaddress');
```

## Contributing

Feel free to dive in! [Open an issue](https://github.com/dashevo/dapi-client/issues/new) or submit PRs.

## License

[MIT](LICENSE) &copy; Dash Core Group, Inc.
