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

const { describe, it, after, before } = require('mocha');
const { Firestore } = require('@google-cloud/firestore');
const assert = require('assert');

const TestCaseRun = require('../lib/testrun');
const addBuild = require('../src/add-build');

const TESTING_COLLECTION_BASE = 'repositories-testsuite-';

const buildInfo = [
  {
    repoId: encodeURIComponent('nodejs/node'),
    organization: 'nodejs',
    buildId: '11111',
    url: 'https://github.com/nodejs/WRONG', // URL starts off wrong
    environment: 'linux-apple',
    timestamp: new Date(),
    testCases: [
      new TestCaseRun('ok', 1, 'a/1'),
      new TestCaseRun('not ok', 2, 'a/2'),
      new TestCaseRun('ok', 3, 'a/3'),
      new TestCaseRun('not ok', 4, 'a/4')
    ]
  },
  {
    repoId: encodeURIComponent('nodejs/node'),
    organization: 'nodejs',
    buildId: '22222', // different build
    url: 'https://github.com/nodejs/node', // URL was fixed
    environment: 'linux-banana', // different environment
    timestamp: new Date(),
    testCases: [
      new TestCaseRun('ok', 1, 'a/1'),
      new TestCaseRun('ok', 2, 'a/2') // this test is now passing
    ]
  },
  {
    repoId: encodeURIComponent('nodejs/node'),
    organization: 'nodejs',
    buildId: '33333',
    url: 'https://github.com/nodejs/node',
    environment: 'linux-banana',
    timestamp: new Date(),
    testCases: [
      new TestCaseRun('not ok', 1, 'a/5'),
      new TestCaseRun('not ok', 2, 'a/2') // this test is now passing
    ]
  }
];

describe('Add-Build', () => {
  let client;
  let testingCollection; //random ID for collection so can be concurrently run
  before(async () => {
    client = new Firestore();
    testingCollection = TESTING_COLLECTION_BASE + Math.random().toString(36).substr(2, 9);
  });
  describe('addBuild', async () => {
    it('Can add a build and repository to a blank collection', async () => {
      await addBuild(buildInfo[0].testCases, buildInfo[0], client, testingCollection);

      // ensure repository was initialized
      const organization = await client.collection(testingCollection).doc(buildInfo[0].repoId).get();
      assert.strictEqual(organization.data().organization, buildInfo[0].organization);
      assert.strictEqual(organization.data().url, buildInfo[0].url);

      // ensure builds were uploaded correctly
      const builds = await client.collection(testingCollection).doc(buildInfo[0].repoId).collection('builds').doc(buildInfo[0].buildId).get();
      assert.strictEqual(builds.data().percentpassing, 0.5);
      assert.strictEqual(builds.data().environment, buildInfo[0].environment);
    });

    it('Can add a different build with overlapping test cases and update repo info', async () => {
      await addBuild(buildInfo[1].testCases, buildInfo[1], client, testingCollection);

      // ensure repository was initialized
      const organization = await client.collection(testingCollection).doc(buildInfo[1].repoId).get();
      assert.strictEqual(organization.data().url, buildInfo[1].url);

      // ensure builds were uploaded correctly
      const builds = await client.collection(testingCollection).doc(buildInfo[1].repoId).collection('builds').doc(buildInfo[1].buildId).get();
      assert.strictEqual(builds.data().percentpassing, 1.0);
      assert.strictEqual(builds.data().environment, buildInfo[1].environment);
    });

    it('Can add a third build with some new test cases, add same thing multiple times', async () => {
      await addBuild(buildInfo[2].testCases, buildInfo[2], client, testingCollection);
      await addBuild(buildInfo[2].testCases, buildInfo[2], client, testingCollection); // done twice to make sure can be called duplicate times

      // ensure builds were uploaded correctly
      const builds = await client.collection(testingCollection).doc(buildInfo[1].repoId).collection('builds').doc(buildInfo[1].buildId).get();
      assert.strictEqual(builds.data().percentpassing, 1.0);
      assert.strictEqual(builds.data().environment, buildInfo[1].environment);

      // ensure tests were uploaded correctly
      var testExpectations = [
        {
          name: 'a/1',
          environments: ['linux-apple', 'linux-banana'],
          percentpassing: 1.0,
          builds: ['11111', '22222']
        },
        {
          name: 'a/2',
          environments: ['linux-apple', 'linux-banana'],
          percentpassing: 1.0 / 3.0,
          builds: ['11111', '22222', '33333']
        },
        {
          name: 'a/3',
          environments: ['linux-apple'],
          percentpassing: 1,
          builds: ['11111']
        },
        {
          name: 'a/4',
          environments: ['linux-apple'],
          percentpassing: 0,
          builds: ['11111']
        },
        {
          name: 'a/5',
          environments: ['linux-banana'],
          percentpassing: 0,
          builds: ['33333']
        }
      ];

    testExpectations.forEach(async (testExpecation) => {
        const test = await client.collection(testingCollection).doc(buildInfo[0].repoId).collection('tests').doc(encodeURIComponent(testExpecation.name)).get();
        assert.strictEqual(test.data().percentpassing, testExpecation.percentpassing);
        assert.deepStrictEqual(test.data().environments, testExpecation.environments);

        // make sure all builds exist
        const testruns = await client.collection(testingCollection).doc(buildInfo[0].repoId).collection('tests').doc(encodeURIComponent(testExpecation.name)).collection('runs').get();
        var testBuilds = [];
        testruns.forEach((doc) => {
          testBuilds.push(doc.id);
        });
        console.log("ASSERTING EQUAL");
        assert.deepStrictEqual(testBuilds, testExpecation.builds);
      });
      console.log("DESCRIBE DONE");
    });
  });

  after(async () => {

    console.log("AFTER START");
    // must delete each collection individually
    const deletePaths = [
      'tests/{testcase}/runs/{buildid}',
      'tests/{testcase}',
      'builds/{buildid}'
    ];
    const buildIds = ['11111', '22222', '33333'];
    const testCases = ['a/1', 'a/2', 'a/3', 'a/4', 'a/5', 'a/6'];
    deletePaths.forEach(async (deletePath) => {
      buildIds.forEach(async (buildId) => {
        testCases.forEach(async (testCase) => {
          const deletePathUse = deletePath.replace('{testcase}', encodeURIComponent(testCase)).replace('{buildid}', buildId);
          await client.collection(testingCollection).doc(buildInfo[0].repoId + "/" + deletePathUse).delete();
        });
      });
    });

    await client.collection(testingCollection).doc(buildInfo[0].repoId).delete();

  });
});
