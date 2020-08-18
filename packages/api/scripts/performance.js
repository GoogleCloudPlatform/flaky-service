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
var client = new Firestore();
const json2csv = require('json2csv').parse;
var fields = ['day', 'addbuildtime', 'testcount', 'builds', 'tests', 'metadata'];
const fetch = require('node-fetch');
require('../server');

const directory = path.resolve(__dirname, 'testing_logs/');
const repositoryCollection = 'performance/3/repos';
global.headCollection = repositoryCollection;
const repoIdentifier = firebaseEncode('per/formance');
const repoURL = 'https://github.com/per/formance';
const organization = 'per';
const repo = 'formance';
console.log('Populating Firestore with TAP files from \ndirectory: ' + directory);
console.log('Putting into ' + repositoryCollection + ' collection');
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

async function uploadDoc (file, daysAfter) {
  const testCases = tapParser.getTestCases(directory + '/' + file, file);
  var testCasesUse = [];
  const allTrue = Math.random() > 0.6;
  for (const tc of testCases) {
    if (Math.random() < 0.6 && !allTrue) {
      tc.successful = false;
      tc.failureMessage = 'Error message stack trace\nline number';
    }
    testCasesUse.push(tc);
  }

  var buildInfo = JSON.parse(JSON.stringify(buildInfoTemplate));
  buildInfo.timestamp = new Date();
  buildInfo.timestamp.setDate(buildInfo.timestamp.getDate() + daysAfter);
  buildInfo.sha = Math.random().toString(36).substring(2, 15);
  buildInfo.buildId = Math.random().toString(36).substring(2, 15);

  await addBuild(testCasesUse, buildInfo, client, repositoryCollection);

  return testCasesUse.length;
}

const requestURLS = [
  'http://localhost:3000/api/repo/per/formance/builds?limit=30',
  'http://localhost:3000/api/repo/per/formance/tests?limit=30',
  'http://localhost:3000/api/repo/per/formance'
];
const requestNames = ['builds', 'tests', 'metadata'];

async function main () {
  fs.readdir(directory, async function (err, files) {
    if (err) {
      return console.log('Unable to scan directory: ' + err);
    }
    const dataAppend = [];
    for (let day = 0; day < 100000; day += 1) {
      const file = files[Math.floor(Math.random() * files.length)];
      const start = new Date();
      const numtestcases = await uploadDoc(file, day);
      const end = new Date();

      const thisRoundData = {
        day: day,
        addbuildtime: end.getTime() - start.getTime(),
        testcount: numtestcases
      };

      for (let i = 0; i < requestURLS.length; i++) {
        const beforeR = new Date();
        const resp = await fetch(requestURLS[i]);
        await resp.text();
        const afterR = new Date();
        thisRoundData[requestNames[i]] = afterR.getTime() - beforeR.getTime();
      }

      dataAppend.push(thisRoundData);

      if (day % 10 === 0) {
        const csv = json2csv(dataAppend, fields);
        fs.writeFileSync('checkpoint/' + day + '.csv', csv);
      }
    }
    const csv = json2csv(dataAppend, fields);
    fs.writeFileSync('final.csv', csv);
    console.log('Done. End program.');
  });
}

main();
