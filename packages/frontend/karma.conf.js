// Copyright 2020 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html

const process = require('process');
process.env.CHROME_BIN = require('puppeteer').executablePath();

module.exports = function (config) {
  const configObj = {
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-edgium-launcher'),
      require('karma-firefox-launcher'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage-istanbul-reporter'),
      require('karma-tap-reporter'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],
    client: {
      clearContext: false // leave Jasmine Spec Runner output visible in browser
    },
    coverageIstanbulReporter: {
      dir: require('path').join(__dirname, './coverage/flaky-dashboard'),
      reports: ['html', 'lcovonly', 'text'],
      fixWebpackSourcePaths: true
    },
    reporters: ['progress', 'kjhtml', 'tap'],
    tapReporter: {
      outputFile: './test.tap',
      disableStdout: true
    },
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    singleRun: true,
    restartOnFileChange: true,
    browsers: ['ChromeHeadlessNoSandbox'],
    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox'],
      },
      FirefoxHeadless: {
        base: 'Firefox',
        flags: [ '-headless' ],
      },
    },
  };

  // select the appropriate browser for the current environment
  const os = process.env.BROWSER || "chrome";
  if (os === 'linux') {
    configObj.browsers = configObj.browsers.concat(['FirefoxHeadless']);
  } else if (os === 'windows') {
    configObj.browsers = configObj.browsers.concat(['Edge']);
  } else if (os === 'mac') {
    configObj.browsers = configObj.browsers.concat(['Safari']);
  }
  
  config.set(configObj);
};
