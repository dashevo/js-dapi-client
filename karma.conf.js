module.exports = (config) => {
  config.set({
    basePath: '',
    frameworks: ['mocha', 'chai'],
    files: [
      './test.spec.js',
    ],
    exclude: [
    ],
    preprocessors: {
      './test.spec.js': ['webpack'],
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
