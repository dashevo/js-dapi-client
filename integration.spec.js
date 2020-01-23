// This file is used for compiling integration tests with webpack into one file for using with karma

const integrationContext = require.context('./test/integration/testnet', true, /\.js$/);

integrationContext.keys().forEach(integrationContext);
