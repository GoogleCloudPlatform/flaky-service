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
const addBuild = require('../src/add-build');
const firebaseEncode = require('../lib/firebase-encode');

const argv = require('yargs')
  .option('collection', {
    default: 'testing/main/repos',
    describe: 'collection to store test data in'
  })
  .option('repo', {
    default: 'nodejs/node',
    describe: 'repo test data is for in format of nodejs/node, so that can be appended to github.com to be url'
  })
  .argv;

const allOrgs = ['alphaorg', 'betaorg'];
const allRepos = ['project', 'codebase', 'server', 'backend', 'actionitem', 'morerepos1', 'morerepo2', 'prefixaaa', 'prefixbbb', 'prefixaab'];

const directory = argv._[0] || path.resolve(__dirname, 'testing_logs/');
const repositoryCollection = argv.collection;
const repoIdentifier = firebaseEncode(argv.repo);
const repoURL = 'https://github.com/' + argv.repo;
const organization = (argv.repo.indexOf('/') > 1) ? argv.repo.substring(0, argv.repo.indexOf('/')) : 'NoORG';
const repo = (argv.repo.indexOf('/') > 1) ? argv.repo.substring(argv.repo.indexOf('/') + 1) : 'NoREPO';
console.log('Populating Firestore with TAP files from \ndirectory: ' + directory);
console.log('Putting into ' + argv.collection + ' collection');
console.log('Marked ' + decodeURIComponent(repoIdentifier) + ' as primary repo');

const buildInfoTemplate = {
  repoId: repoIdentifier,
  organization: organization,
  url: repoURL,
  environment: {
    os: 'Linux',
    tag: 'NA',
    matrix: JSON.stringify({ Node: 11 }),
    ref: 'branch/master'
  },
  name: repo,
  description: 'A repository that is a repository... more description',
  buildmessage: 'dfdfdf'
};

const NUM_DOCUMENTS = 5;
async function main () {
  fs.readdir(directory, async function (err, files) {
    if (err) {
      return console.log('Unable to scan directory: ' + err);
    }

    var client = new Firestore();
    let counter = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (counter < NUM_DOCUMENTS) {
        counter += 1;
        const testCases = tapParser.getTestCases(directory + '/' + file, file);
        var testCasesUse = [];
        const allTrue = Math.random() > 0.8;
        for (const tc of testCases) {
          if (tc.name.startsWith('a')) {
            if (Math.random() < 0.6 && !allTrue) {
              tc.successful = false;
              tc.failureMessage = 'Error message stack trace\nline number';
            }
            testCasesUse.push(tc);
          }
        }

        var buildInfo = JSON.parse(JSON.stringify(buildInfoTemplate));
        buildInfo.timestamp = new Date();
        buildInfo.timestamp.setDate(buildInfo.timestamp.getDate() + Math.floor(Math.random() * 100));
        buildInfo.sha = Math.random().toString(36).substring(2, 15);
        buildInfo.buildId = Math.random().toString(36).substring(2, 15);
        buildInfo.environment.os = (Math.random() > 0.5) ? 'Linux' : 'Windows';
        buildInfo.environment.ref = (Math.random() > 0.66) ? 'ref/master' : ((Math.random() > 0.5) ? 'ref/a' : 'ref/b');
        buildInfo.environment.matrix = (Math.random() > 0.5) ? JSON.stringify({ Node: 11 }) : JSON.stringify({ Node: 10 });

        // put half of tests in default repo/org
        if (Math.random() > 0.5) {
          buildInfo.organization = allOrgs[Math.floor(Math.random() * allOrgs.length)];
          buildInfo.name = allRepos[Math.floor(Math.random() * allRepos.length)];
          buildInfo.repoId = firebaseEncode(buildInfo.organization + '/' + buildInfo.name);
          buildInfo.repoURL = 'http://github.com/' + buildInfo.organization + '/' + buildInfo.name;
        }
        buildInfo.description = 'Description for the repository of ' + decodeURIComponent(buildInfo.repoId);

        addBuild(testCasesUse, buildInfo, client, repositoryCollection);
      }
    }
  });
}
main();
