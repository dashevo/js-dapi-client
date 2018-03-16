const path = require('path');

module.exports = (config) => {
  config.set({
    basePath: '',
    frameworks: ['mocha', 'chai'],
    files: [
      './src/**/*.js',
      './test/**/*.js',
    ],
    exclude: [
    ],
    preprocessors: {
      './test/**/*.js': ['webpack'],
    },
    webpack: {
      module: {
        rules: [
          {
            test: /\.js$/,
            exclude: /(node_modules)/,
            use: {
              loader: 'babel-loader',
              options: {
                presets: ['env'],
              },
            },
          },
        ],
      },
      output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'test.js',
      },
    },
    reporters: ['progress'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    browsers: ['Chrome', 'Firefox'],
    singleRun: false,
    concurrency: Infinity,
    plugins: [
      'karma-mocha',
      'karma-chai',
      'karma-chrome-launcher',
      'karma-firefox-launcher',
      'karma-webpack',
    ],
  });
};
