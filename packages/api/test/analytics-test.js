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
const assert = require('assert');
const { v4: uuidv4 } = require('uuid');
const client = require('../src/firestore.js');

const TestCaseRun = require('../lib/testrun');
const addBuild = require('../src/add-build');
const { deleteRepo } = require('../lib/deleter');

const buildInfo = {
  repoId: encodeURIComponent('flaky/repo'),
  organization: 'flaky',
  name: 'repo',
  sha: '123',
  url: 'https://github.com/nodejs/WRONG', // URL starts off wrong
  description: 'Repository description',
  environment: {
    os: 'linux-apple',
    matrix: { 'node-version': '12.0' },
    ref: 'master',
    tag: 'abc'
  },
  buildmessage: 'Workflow - 99'
};
// testcases a, b, c, d
// 0 is one recent failure
// 1 is flaky with regards to the current build, and makes the repo flaky
// 2 is flaky, but not in regards to the most recent build
// 3 failed quite a bit, but was never flaky

// does NOT test because time constraints
// - two failing test cases more than 10 apart
// - a formerly flaky test that is no longer flaky
// Each update is does O(t*n) if there are t test cases with n runs each
// so do do a run with n runs being added sequentially is O(t*n^2)

const testCases = [
  // tc 1, 2, 3 4
  [true, true, false, false], // build 0, in 2020
  [true, false, true, false],
  // [true, false, false, true] /2021.5 addded later non chronologically
  [true, true, false, false],
  [false, false, true, false]
];

describe('Flaky-Analytics', () => {
  before(async () => {
    global.headCollection = 'testing/' + 'analytics-testsuite-' + uuidv4() + '/repos'; // random collection name for concurrent testing

    for (let i = 0; i < testCases.length; i++) {
      const testCaseObjs = [];
      for (let k = 0; k < testCases[i].length; k++) {
        testCaseObjs.push(new TestCaseRun(testCases[i][k] ? 'ok' : 'not ok', k, k.toString()));
      }
      const updateObj = JSON.parse(JSON.stringify(buildInfo));
      updateObj.timestamp = new Date('01/01/202' + i.toString());
      updateObj.buildId = i.toString();

      await addBuild(testCaseObjs, updateObj, client, global.headCollection);
    }
  });
  describe('Getting Flaky vals', async () => {
    it('Should track stats for a repository', async () => {
      const repoData = await client.collection(global.headCollection).doc(buildInfo.repoId).get();
      assert.strictEqual(repoData.data().numfails, 3);
      assert.strictEqual(repoData.data().numtestcases, 4);
      assert.strictEqual(repoData.data().flaky, 2);
    });

    it('Should track stats for builds', async () => {
      const buildFlakyExpecations = [0, 0, 1, 1];
      for (let i = 0; i < buildFlakyExpecations.length; i++) {
        const buildData = await client.collection(global.headCollection).doc(buildInfo.repoId).collection('builds').where('buildId', '==', i.toString()).get();
        let result;
        buildData.forEach(r => { result = r; });
        assert.strictEqual(result.data().flaky, buildFlakyExpecations[i]);
      }
    });

    it('Should track stats for tests', async () => {
      const testFlakyExpecations = [false, true, true, false];
      for (let i = 0; i < testFlakyExpecations.length; i++) {
        const testData = await client.collection(global.headCollection).doc(buildInfo.repoId).collection('tests').doc(i.toString()).get();
        assert.strictEqual(testData.data().flaky, testFlakyExpecations[i]);
      }
    });

    it('Can re-add builds', async () => {
      const updateObj = JSON.parse(JSON.stringify(buildInfo));
      updateObj.timestamp = new Date('01/01/2020');
      updateObj.buildId = '0';
      const testCaseObjs = [];
      for (let k = 0; k < testCases[0].length; k++) {
        testCaseObjs.push(new TestCaseRun(testCases[0][k] ? 'ok' : 'not ok', k, k.toString()));
      }

      // readding the first build should mantain its status as nonflaky
      // since only looking at test cases with timestamps prior
      await addBuild(testCaseObjs, updateObj, client, global.headCollection);

      // buildata not changed
      const buildData = await client.collection(global.headCollection).doc(buildInfo.repoId).collection('builds').where('buildId', '==', '0').get();
      let result;
      buildData.forEach(r => { result = r; });
      assert.strictEqual(result.data().flaky, 0);

      // test case flakyness not changed
      const testFlakyExpecations = [false, true, true, false];
      for (let i = 0; i < testFlakyExpecations.length; i++) {
        const testData = await client.collection(global.headCollection).doc(buildInfo.repoId).collection('tests').doc(i.toString()).get();
        assert.strictEqual(testData.data().flaky, testFlakyExpecations[i]);
      }
    });

    it('Can add builds non chronologically', async () => {
      const updateObj = JSON.parse(JSON.stringify(buildInfo));
      updateObj.timestamp = new Date('06/01/2021');
      updateObj.buildId = '1.5';
      const testCaseObjs = [];
      const nonChronTestCases = [true, false, false, true];
      for (let k = 0; k < nonChronTestCases.length; k++) {
        testCaseObjs.push(new TestCaseRun(nonChronTestCases[k] ? 'ok' : 'not ok', k, k.toString()));
      }

      await addBuild(testCaseObjs, updateObj, client, global.headCollection);

      // check builddata
      const buildData = await client.collection(global.headCollection).doc(buildInfo.repoId).collection('builds').where('buildId', '==', '1.5').get();
      let result;
      buildData.forEach(r => { result = r; });
      assert.strictEqual(result.data().flaky, 1); // only 1 is flaky at this point

      // ensure test cases flakyness is updated
      const testFlakyExpecations = [false, true, true, true]; // note test case 4 has now become flaky
      for (let i = 0; i < testFlakyExpecations.length; i++) {
        const testData = await client.collection(global.headCollection).doc(buildInfo.repoId).collection('tests').doc(i.toString()).get();
        assert.strictEqual(testData.data().flaky, testFlakyExpecations[i]);
      }

      // repo info changes flaky count, does not change num test cases/ numfails count
      const repoData = await client.collection(global.headCollection).doc(buildInfo.repoId).get();
      assert.strictEqual(repoData.data().numfails, 3); // number of tests/failing testss has not changed, since this is not up to date
      assert.strictEqual(repoData.data().numtestcases, 4);
      assert.strictEqual(repoData.data().flaky, 3); // # flaky tests has Changed
    });
  });

  after(async () => {
    await deleteRepo(client, decodeURIComponent(buildInfo.repoId));
  });
});
