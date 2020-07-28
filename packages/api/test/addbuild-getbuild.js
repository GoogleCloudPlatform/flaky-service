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

const { describe, it, before } = require('mocha');
const assert = require('assert');
const { v4: uuidv4 } = require('uuid');
const client = require('../src/firestore.js');
const firebaseEncode = require('../lib/firebase-encode');

const TestCaseRun = require('../lib/testrun');
const addBuild = require('../src/add-build');
const { deleteTest, deleteRepo } = require('../lib/deleter');

const fetch = require('node-fetch');
const TESTING_COLLECTION_BASE = 'repositories-testsuite-';

const fs = require('fs');
var path = require('path');
const SIMPLE_EXPORT = fs.readFileSync(path.join(__dirname, 'res/simpleexport.csv'), 'utf8');
const TRICKY_EXPORT = fs.readFileSync(path.join(__dirname, 'res/trickyexport.csv'), 'utf8');

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
    ],
    description: 'nodejs repository',
    buildmessage: 'Workflow - 1'
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
    ],
    description: 'nodejs repository',
    buildmessage: 'Workflow - 2'
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
    ],
    description: 'nodejs repository',
    buildmessage: 'Workflow - 1'
  }
];

buildInfo[2].testCases[0].failureMessage = 'Error message';
buildInfo[2].testCases[1].failureMessage = 'Error message';

describe('Add-Build', () => {
  before(async () => {
    global.headCollection = 'testing/' + TESTING_COLLECTION_BASE + uuidv4() + '/repos'; // random collection name for concurrent testing
  });

  describe('add-build', async () => {
    it('Can add a build and repository to a blank collection', async () => {
      await addBuild(buildInfo[0].testCases, buildInfo[0], client, global.headCollection);

      // ensure repository was initialized
      const organization = await client.collection(global.headCollection).doc(buildInfo[0].repoId).get();
      assert.strictEqual(organization.data().organization, buildInfo[0].organization);
      assert.strictEqual(organization.data().url, buildInfo[0].url);
      assert.strictEqual(organization.data().description, buildInfo[0].description);

      // ensure builds were uploaded correctly
      const builds = await client.collection(global.headCollection).doc(buildInfo[0].repoId).collection('builds').doc(buildInfo[0].buildId).get();
      assert.strictEqual(builds.data().percentpassing, 0.5);
      assert.strictEqual(builds.data().passcount, 2);
      assert.strictEqual(builds.data().failcount, 2);
      assert.deepStrictEqual(builds.data().environment, buildInfo[0].environment);
      assert.deepStrictEqual(builds.data().buildmessage, buildInfo[0].buildmessage);
    });

    it('Can add a different build with overlapping test cases and update repo info', async () => {
      await addBuild(buildInfo[1].testCases, buildInfo[1], client, global.headCollection);

      // ensure repository was initialized
      const organization = await client.collection(global.headCollection).doc(buildInfo[1].repoId).get();
      assert.strictEqual(organization.data().url, buildInfo[1].url);
      assert.strictEqual(organization.data().description, buildInfo[1].description);

      // ensure builds were uploaded correctly
      const builds = await client.collection(global.headCollection).doc(buildInfo[1].repoId).collection('builds').doc(buildInfo[1].buildId).get();
      console.log('BUIDLS>DATA: ' + builds.data().percentpassing);
      assert.strictEqual(builds.data().percentpassing, 1.0);
      assert.strictEqual(builds.data().passcount, 2);
      assert.strictEqual(builds.data().failcount, 0);
      assert.deepStrictEqual(builds.data().environment, buildInfo[1].environment);
      assert.strictEqual(builds.data().buildmessage, buildInfo[1].buildmessage);
    });

    it('Can add a third build with some new test cases, add same thing multiple times', async () => {
      await addBuild(buildInfo[2].testCases, buildInfo[2], client, global.headCollection);

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
          builds: [buildInfo[0].buildId, buildInfo[1].buildId],
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
          builds: [buildInfo[0].buildId, buildInfo[1].buildId, buildInfo[2].buildId],
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
          builds: [buildInfo[0].buildId],
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
          builds: [buildInfo[0].buildId],
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
          builds: [buildInfo[2].buildId],
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
        assert.deepStrictEqual(new Set(testBuilds), new Set(testExpecation.builds));
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

  describe('GetRepoHandler', async () => {
    it('Can get limit and sort by date', async () => {
      const resp = await fetch('http://localhost:3000/api/repo/nodejs/node/builds?limit=1');
      const respMeta = await fetch('http://localhost:3000/api/repo/nodejs/node');

      const respText = await resp.text();
      const respTextMeta = await respMeta.text();

      const ansObj = JSON.parse(respText).builds;

      assert.strictEqual(ansObj.length, 1);
      assert.strictEqual(ansObj[0].buildId, '33333');
      assert.strictEqual(ansObj[0].percentpassing, 0);
      assert.strictEqual(ansObj[0].tests.length, 2);

      const solMeta = { name: 'node', repoId: 'nodejs/node', description: 'nodejs repository', organization: 'nodejs', searchindex: 2 * 10000, numfails: 2, flaky: 0, numtestcases: 2, lower: { name: 'node', repoId: 'nodejs/node', organization: 'nodejs' }, environments: { matrix: [{ 'node-version': '12.0' }], os: ['linux-apple', 'linux-banana'], tag: ['abc', 'xyz'], ref: ['master'] }, url: 'https://github.com/nodejs/node' };
      const solActual = JSON.parse(respTextMeta);
      delete solActual.lastupdate;
      assert.deepStrictEqual(solActual, solMeta);
    });

    it('Can use offset when getting builds', async () => {
      const resp = await fetch('http://localhost:3000/api/repo/nodejs/node/builds?offset=1');
      const respText = await resp.text();
      const ansObj = JSON.parse(respText).builds;
      assert.strictEqual(ansObj.length, 2);
    });

    it('Can use random combinations of queries', async () => {
      const resp = await fetch('http://localhost:3000/api/repo/nodejs/node/builds?os=linux-banana&matrix={%22node-version%22:%2212.0%22}');
      const respText = await resp.text();

      const ansObj = JSON.parse(respText).builds;

      assert.strictEqual(ansObj.length, 2);
      assert.strictEqual(ansObj[0].buildId, '33333');
      assert.strictEqual(ansObj[0].percentpassing, 0);
      assert.strictEqual(ansObj[0].tests.length, 2);

      assert.strictEqual(ansObj[1].buildId, '22222');
      assert.strictEqual(ansObj[1].percentpassing, 1);
      assert.strictEqual(ansObj[1].tests.length, 2);
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

    it('Can return all tests in the right order', async () => {
      const resp = await fetch('http://localhost:3000/api/repo/nodejs/node/tests');
      const respText = await resp.text();
      const ansObj = JSON.parse(respText).tests;

      assert(ansObj[0].name === 'a/5' || ansObj[0].name === 'a/2'); // both failed on most recent build
      assert(ansObj[1].name === 'a/5' || ansObj[1].name === 'a/2'); // both failed on most recent build

      assert(ansObj[2].name === 'a/4'); // failed on build before the last build

      assert(ansObj[3].name === 'a/3' || ansObj[3].name === 'a/1'); // both failed on most recent build
      assert(ansObj[4].name === 'a/3' || ansObj[4].name === 'a/1'); // both failed on most recent build

      // make sure their are the newly added fields
      assert.strictEqual(ansObj[2].lifetimepasscount, 0);
      assert.strictEqual(ansObj[2].lifetimefailcount, 1);
      assert.strictEqual(ansObj[0].failuremessageiffailing, 'Error message');
    });

    it('Can use offset and limit parameter for tests', async () => {
      const resp = await fetch('http://localhost:3000/api/repo/nodejs/node/tests?offset=3&limit=1');
      const respText = await resp.text();
      const ansObj = JSON.parse(respText);
      assert.strictEqual(ansObj.tests.length, 1);
      assert.strictEqual(ansObj.hasprev, true);
      assert.strictEqual(ansObj.hasnext, true);
    });
  });

  describe('GetBuildHandler', async () => {
    it('Can get a particular build', async () => {
      const resp = await fetch('http://localhost:3000/api/repo/nodejs/node/build/' + buildInfo[2].buildId);

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

  describe('GetExportHandler', async () => {
    it('Can get a csv export', async () => {
      const resp = await fetch('http://localhost:3000/api/repo/nodejs/node/csv');

      const respText = await resp.text();

      const linesReal = respText.split(/\n/);
      const linesExpected = SIMPLE_EXPORT.split(/\n/);
      assert.strictEqual(linesReal.length, linesExpected.length);
      for (let i = 0; i < linesReal.length; i++) {
        const rowReal = linesReal[i].split(/,\s/);
        const rowExpected = linesExpected[i].split(/,\s/);
        assert.strictEqual(rowReal.length, rowExpected.length);
        for (let k = 0; k < rowReal.length; k++) {
          if (k !== 1) { // ignore timestamp
            assert.strictEqual(rowReal[k], rowExpected[k]);
          }
        }
      }
    });

    it('Can handle exports with tricky matrix parameter', async () => {
      const buildInfoExport = {
        repoId: encodeURIComponent('nodejs/node'),
        organization: 'nodejs',
        name: 'node',
        buildId: '44444',
        sha: '999',
        url: 'https://github.com/nodejs/node',
        environment: {
          os: 'linux-banana',
          matrix: { 'node-version': '12.0', 'other field': '12.0' },
          ref: 'master',
          tag: 'xyz'
        },
        timestamp: new Date('01/01/2004'),
        testCases: [
          new TestCaseRun('not ok', 1, 'a/5'),
          new TestCaseRun('not ok', 2, 'a/2') // this test is now passing
        ],
        description: 'nodejs repository',
        buildmessage: 'Workflow - 42'
      };
      await addBuild(buildInfoExport.testCases, buildInfoExport, client, global.headCollection);

      const resp = await fetch('http://localhost:3000/api/repo/nodejs/node/csv');

      const respText = await resp.text();

      const linesReal = respText.split(/\n/);
      const linesExpected = TRICKY_EXPORT.split(/\n/);
      assert.strictEqual(linesReal.length, linesExpected.length);
      for (let i = 0; i < linesReal.length; i++) {
        const rowReal = linesReal[i].split(/,\s/);
        const rowExpected = linesExpected[i].split(/,\s/);
        assert.strictEqual(rowReal.length, rowExpected.length);
        for (let k = 0; k < rowReal.length; k++) {
          if (k !== 1) { // ignore timestamp
            assert.strictEqual(rowReal[k], rowExpected[k]);
          }
        }
      }
    });
  });

  describe('Duplicate Addbuild', async () => {
    it('Can add two builds with the same id and treat them differently', async () => {
      await addBuild(buildInfo[2].testCases, buildInfo[2], client, global.headCollection);

      const allBuilds = await client.collection(global.headCollection).doc(buildInfo[1].repoId).collection('builds').get();
      assert.deepStrictEqual(allBuilds.size, 5);
    });
  });

  describe('deleter', async () => {
    it('Can delete a particular test', async () => {
      await deleteTest(client, decodeURIComponent(buildInfo[0].repoId), 'a/1');

      // make sure that test is no longer there
      const testDoc = await client.collection(global.headCollection).doc(buildInfo[0].repoId).collection('tests').doc(firebaseEncode('a/1')).get();

      assert(!testDoc.exists);

      // make sure the repo doc is still there
      const repoDoc = await client.collection(global.headCollection).doc(buildInfo[0].repoId).get();
      assert(repoDoc.exists);
    });

    it('Can delete an entire repository', async () => {
      await deleteRepo(client, decodeURIComponent(buildInfo[0].repoId));

      // make sure the repo doc is still there
      const repoDoc = await client.collection(global.headCollection).doc(buildInfo[0].repoId).get();
      assert(!repoDoc.exists);
    });
  });
});
