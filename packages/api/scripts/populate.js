#!/usr/bin/env node

// Copyright 2020 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/*
Populates database with testing logs from the testing_logs subdirectory
*/

const fs = require('fs');
const path = require('path');
const tapParser = require('./../lib/tap-parser.js');
const { Firestore } = require('@google-cloud/firestore');
const argv = require('yargs')
  .option('collection', {
    default: 'repositories-fake',
    describe: 'collection to store test data in'
  })
  .option('repo', {
    default: 'nodejs/node',
    describe: 'repo test data is for in format of nodejs/node, so that can be appended to github.com to be url'
  })
  .argv;

const directory = argv._[0] || path.resolve(__dirname, 'testing_logs/');
const repositoryCollection = argv.collection;
const repoIdentifier = encodeURIComponent(argv.repo);
const repoURL = 'https://github.com/' + argv.repo;
const organization = (argv.repo.indexOf('/') > 1) ? argv.repo.substring(0, argv.repo.indexOf('/')) : 'No organization found';

console.log('Populating Firestore with TAP files from \ndirectory: ' + directory);
console.log('Putting into ' + argv.collection + ' collection');
console.log('Marked a ' + repoIdentifier + ' repo in ' + organization + ' organization');

fs.readdir(directory, function (err, files) {
  if (err) {
    return console.log('Unable to scan directory: ' + err);
  }

  var client = new Firestore();

  // first initialize repository information
  client.collection(repositoryCollection).doc(repoIdentifier).set({
    url: repoURL,
    organization: organization
  });

  files.forEach(function (file) {
    var testCases = tapParser.getTestCases(directory + '/' + file, file);

    var failures = {};
    var successes = [];

    testCases.forEach(function (testCase) {
      client.collection(repositoryCollection).doc(repoIdentifier).collection('tests').doc(testCase.encodedName)
        .collection('runs').doc(testCase.buildid).set({
          timestamp: testCase.timestamp,
          environment: testCase.environment,
          status: testCase.successful ? 'OK' : testCase.failureMessage
        });

      client.collection(repositoryCollection).doc(repoIdentifier).collection('tests').doc(testCase.encodedName).update({
        environments: Firestore.FieldValue.arrayUnion(testCase.environment)
      }, { merge: true });

      if (testCase.successful) {
        successes.push(testCase.encodedName);
      } else {
        failures[testCase.encodedName] = testCase.failureMessage;
      }
    });

    client.collection(repositoryCollection).doc(repoIdentifier).collection('builds').doc(testCases[0].buildid).set({
      environment: testCases[0].environment,
      timestamp: testCases[0].timestamp,
      successes: successes,
      failures: failures
    });
  });
});
