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
const { v4: uuidv4 } = require('uuid');

const TestCaseRun = require('../lib/testrun');
const addBuild = require('../src/add-build');
const fetch = require('node-fetch');

const TESTING_COLLECTION_BASE = 'repositories-testsuite-';

// The three builds that will be added
const buildInfo = [
  {
    repoId: encodeURIComponent('nodejs/node'),
    organization: 'nodejs',
    name: 'node',
    buildId: '11111',
    sha: '123',
    url: 'https://github.com/nodejs/WRONG', // URL starts off wrong
    environment: {
      os: 'linux-apple',
      matrix: { 'node-version': '12.0' },
      ref: 'master',
      tag: 'abc'
    },
    timestamp: new Date('01/01/2001'),
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
    name: 'node',
    buildId: '22222', // different build
    sha: '456',
    url: 'https://github.com/nodejs/node', // URL was fixed
    environment: {
      os: 'linux-banana',
      matrix: { 'node-version': '12.0' },
      ref: 'master',
      tag: 'xyz'
    },
    timestamp: new Date('01/01/2000'),
    testCases: [
      new TestCaseRun('ok', 1, 'a/1'),
      new TestCaseRun('ok', 2, 'a/2') // this test is now passing
    ]
  },
  {
    repoId: encodeURIComponent('nodejs/node'),
    organization: 'nodejs',
    name: 'node',
    buildId: '33333',
    sha: '789',
    url: 'https://github.com/nodejs/node',
    environment: {
      os: 'linux-banana',
      matrix: { 'node-version': '12.0' },
      ref: 'master',
      tag: 'xyz'
    },
    timestamp: new Date('01/01/2002'),
    testCases: [
      new TestCaseRun('not ok', 1, 'a/5'),
      new TestCaseRun('not ok', 2, 'a/2') // this test is now passing
    ]
  }
];

describe('Add-Build', () => {
  let client;

  before(async () => {
    client = new Firestore({
      projectId: process.env.FLAKY_DB_PROJECT || 'flaky-dev-development'
    });
    global.headCollection = TESTING_COLLECTION_BASE + uuidv4(); // random collection name for concurrent testing
  });

  describe('add-build', async () => {
    it('Can add a build and repository to a blank collection', async () => {
      await addBuild(buildInfo[0].testCases, buildInfo[0], client, global.headCollection);

      // ensure repository was initialized
      const organization = await client.collection(global.headCollection).doc(buildInfo[0].repoId).get();
      assert.strictEqual(organization.data().organization, buildInfo[0].organization);
      assert.strictEqual(organization.data().url, buildInfo[0].url);

      // ensure builds were uploaded correctly
      const builds = await client.collection(global.headCollection).doc(buildInfo[0].repoId).collection('builds').doc(buildInfo[0].buildId).get();
      assert.strictEqual(builds.data().percentpassing, 0.5);
      assert.deepStrictEqual(builds.data().environment, buildInfo[0].environment);
    });

    it('Can add a different build with overlapping test cases and update repo info', async () => {
      await addBuild(buildInfo[1].testCases, buildInfo[1], client, global.headCollection);

      // ensure repository was initialized
      const organization = await client.collection(global.headCollection).doc(buildInfo[1].repoId).get();
      assert.strictEqual(organization.data().url, buildInfo[1].url);

      // ensure builds were uploaded correctly
      const builds = await client.collection(global.headCollection).doc(buildInfo[1].repoId).collection('builds').doc(buildInfo[1].buildId).get();
      assert.strictEqual(builds.data().percentpassing, 1.0);
      assert.deepStrictEqual(builds.data().environment, buildInfo[1].environment);
    });

    it('Can add a third build with some new test cases, add same thing multiple times', async () => {
      await addBuild(buildInfo[2].testCases, buildInfo[2], client, global.headCollection);
      await addBuild(buildInfo[2].testCases, buildInfo[2], client, global.headCollection); // done twice to make sure can be called duplicate times

      // ensure builds were uploaded correctly
      const builds = await client.collection(global.headCollection).doc(buildInfo[1].repoId).collection('builds').doc(buildInfo[1].buildId).get();
      assert.strictEqual(builds.data().percentpassing, 1.0);
      assert.deepStrictEqual(builds.data().environment, buildInfo[1].environment);

      // ensure tests were uploaded correctly
      var testExpectations = [
        {
          name: 'a/1',
          environments: {
            os: ['linux-apple', 'linux-banana'],
            matrix: [{ 'node-version': '12.0' }],
            ref: ['master'],
            tag: ['abc', 'xyz']
          },
          percentpassing: 1.0,
          builds: ['11111', '22222'],
          flaky: 0
        },
        {
          name: 'a/2',
          environments: {
            os: ['linux-apple', 'linux-banana'],
            matrix: [{ 'node-version': '12.0' }],
            ref: ['master'],
            tag: ['abc', 'xyz']
          },
          percentpassing: 1.0 / 3.0,
          builds: ['11111', '22222', '33333'],
          flaky: 0
        },
        {
          name: 'a/3',
          environments: {
            os: ['linux-apple'],
            matrix: [{ 'node-version': '12.0' }],
            ref: ['master'],
            tag: ['abc']
          },
          percentpassing: 1,
          builds: ['11111'],
          flaky: 0
        },
        {
          name: 'a/4',
          environments: {
            os: ['linux-apple'],
            matrix: [{ 'node-version': '12.0' }],
            ref: ['master'],
            tag: ['abc']
          },
          percentpassing: 0,
          builds: ['11111'],
          flaky: 0
        },
        {
          name: 'a/5',
          environments: {
            os: ['linux-banana'],
            matrix: [{ 'node-version': '12.0' }],
            ref: ['master'],
            tag: ['xyz']
          },
          percentpassing: 0,
          builds: ['33333'],
          flaky: 0
        }
      ];

      for (var k = 0; k < testExpectations.length; k++) {
        var testExpecation = testExpectations[k];

        const test = await client.collection(global.headCollection).doc(buildInfo[0].repoId).collection('tests').doc(encodeURIComponent(testExpecation.name)).get();
        assert.strictEqual(test.data().percentpassing, testExpecation.percentpassing);
        assert.deepStrictEqual(test.data().environments, testExpecation.environments);

        // make sure all builds exist
        const testruns = await client.collection(global.headCollection).doc(buildInfo[0].repoId).collection('tests').doc(encodeURIComponent(testExpecation.name)).collection('runs').get();
        var testBuilds = [];
        testruns.forEach((doc) => {
          testBuilds.push(doc.id);
        });
        assert.deepStrictEqual(testBuilds, testExpecation.builds);
      }

      // lastly make sure the repository has correctly stored the build fields
      const repoInfo = await client.collection(global.headCollection).doc(buildInfo[1].repoId).get();
      const repoInfoExpectation = {
        os: ['linux-apple', 'linux-banana'],
        matrix: [{ 'node-version': '12.0' }],
        ref: ['master'],
        tag: ['abc', 'xyz']
      };
      assert.deepStrictEqual(repoInfo.data().environments, repoInfoExpectation);
    });
  });

  describe('GetBuildHandler', async () => {
    it('Can get limit and sort by date', async () => {
      const resp = await fetch('http://localhost:3000/api/repo/nodejs/node?limit=1');

      const respText = await resp.text();
      const sol = '[{"buildId": "33333","sha": "789","flaky": 0, "percentpassing":0,"successes":[],"failures":{"a%2F2":"TODO ERROR MESSAGE, (e.g. stackoverflow error line 13)","a%2F5":"TODO ERROR MESSAGE, (e.g. stackoverflow error line 13)"},"environment":{"matrix":{"node-version":"12.0"},"os":"linux-banana","tag":"xyz","ref":"master"}}]';

      const ansObj = JSON.parse(respText).builds;
      delete ansObj[0].timestamp;
      assert.deepStrictEqual(ansObj, JSON.parse(sol));

      const solMeta = { name: 'node', repoId: 'nodejs/node', organization: 'nodejs', numfails: 2, flaky: 0, numtestcases: 2, lower: { name: 'node', repoId: 'nodejs/node', organization: 'nodejs' }, environments: { matrix: [{ 'node-version': '12.0' }], os: ['linux-apple', 'linux-banana'], tag: ['abc', 'xyz'], ref: ['master'] }, url: 'https://github.com/nodejs/node' };

      assert.deepStrictEqual(JSON.parse(respText).metadata, solMeta);
    });

    it('Can use random combinations of queries', async () => {
      const resp = await fetch('http://localhost:3000/api/repo/nodejs/node?os=linux-banana&matrix={%22node-version%22:%2212.0%22}');
      const respText = await resp.text();

      const sol = '[{"buildId": "33333","sha": "789","flaky": 0, "percentpassing":0,"successes":[],"failures":{"a%2F2":"TODO ERROR MESSAGE, (e.g. stackoverflow error line 13)","a%2F5":"TODO ERROR MESSAGE, (e.g. stackoverflow error line 13)"},"environment":{"matrix":{"node-version":"12.0"},"os":"linux-banana","tag":"xyz","ref":"master"}},{"buildId": "22222","sha": "456","flaky": 0,"percentpassing":1,"successes":["a%2F1","a%2F2"],"failures":{},"environment":{"matrix":{"node-version":"12.0"},"os":"linux-banana","tag":"xyz","ref":"master"}}]';

      const ansObj = JSON.parse(respText).builds;
      delete ansObj[0].timestamp;
      delete ansObj[1].timestamp;
      assert.deepStrictEqual(ansObj, JSON.parse(sol));
    });
  });

  describe('GetTestHandler', async () => {
    it('Can get limit and sort by date', async () => {
      const resp = await fetch('http://localhost:3000/api/repo/nodejs/node/test?name=a%2F1&limit=1');

      const respText = await resp.text();
      const ansObj = JSON.parse(respText);

      assert.strictEqual(ansObj.builds.length, 1);
      assert.strictEqual(ansObj.builds[0].buildId, '11111');

      assert.deepStrictEqual(ansObj.metadata.environments.os, ['linux-apple', 'linux-banana']);
    });

    it('Can use random combinations of queries', async () => {
      const resp = await fetch('http://localhost:3000/api/repo/nodejs/node/test?name=a%2F2&os=linux-banana&matrix={%22node-version%22:%2212.0%22}');
      const respText = await resp.text();
      const ansObj = JSON.parse(respText);

      assert.strictEqual(ansObj.builds.length, 2);
      assert.strictEqual(ansObj.builds[0].buildId, '33333');
      assert.strictEqual(ansObj.builds[1].buildId, '22222');

      assert.deepStrictEqual(ansObj.metadata.environments.os, ['linux-apple', 'linux-banana']);
    });

    it('Can Handle Malformed requests', async () => {
      const resp = await fetch('http://localhost:3000/api/repo/nodejs/node/test?name=a%2F2&RANDOFIELD=3');
      const respText = await resp.text();
      const ansObj = JSON.parse(respText);

      assert('error' in ansObj);
      assert.strictEqual(resp.status, 400);
    });
    it('Can Handle length 0 request', async () => {
      const resp = await fetch('http://localhost:3000/api/repo/nodejs/node/test?name=DOESNOTEXIST');
      const respText = await resp.text();
      const ansObj = JSON.parse(respText);

      assert('error' in ansObj);
      assert.strictEqual(resp.status, 404);
    });
  });

  describe('GetBuildHandler', async () => {
    it('Can get a particular build', async () => {
      const resp = await fetch('http://localhost:3000/api/repo/nodejs/node/build/33333');

      const respText = await resp.text();
      const ansObj = JSON.parse(respText);

      assert.strictEqual(ansObj.sha, '789');
    });

    it('Can get a nonexistant build', async () => {
      const resp = await fetch('http://localhost:3000/api/repo/flaky/repo/build/DOESNOTEXIST');

      const respText = await resp.text();
      const ansObj = JSON.parse(respText);

      assert('error' in ansObj);
      assert.strictEqual(resp.status, 404);
    });

    it('Can get a nonexistant repo', async () => {
      const resp = await fetch('http://localhost:3000/api/repo/flaky/DOESNOTEXIST/build/33333');

      const respText = await resp.text();
      const ansObj = JSON.parse(respText);

      assert('error' in ansObj);
      assert.strictEqual(resp.status, 404);
    });
  });

  after(async () => {
    // must delete each collection individually
    const deletePaths = [
      'tests/{testcase}/runs/{buildid}',
      'tests/{testcase}',
      'builds/{buildid}'
    ];
    const buildIds = ['11111', '22222', '33333'];
    const testCases = ['a/1', 'a/2', 'a/3', 'a/4', 'a/5', 'a/6'];
    // Delete all possible documents, okay to delete document that doesnt exist
    for (let a = 0; a < deletePaths.length; a++) {
      for (let b = 0; b < buildIds.length; b++) {
        for (let c = 0; c < testCases.length; c++) {
          const { deletePath, buildId, testCase } = { deletePath: deletePaths[a], buildId: buildIds[b], testCase: testCases[c] };
          const deletePathUse = deletePath.replace('{testcase}', encodeURIComponent(testCase)).replace('{buildid}', buildId);
          await client.collection(global.headCollection).doc(buildInfo[0].repoId + '/' + deletePathUse).delete();
        }
      }
    }

    await client.collection(global.headCollection).doc(buildInfo[0].repoId).delete();
  });
});
