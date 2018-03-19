// This file is used for compiling tests with webpack into one file for using with karma
require('babel-polyfill');

const testsContext = require.context('./test/src', true, /\.js$/);

testsContext.keys().forEach(testsContext);
