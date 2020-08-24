
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

const { describe, before, beforeEach, after, afterEach, it } = require('mocha');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const sinon = require('sinon');
const assert = require('assert');
const fetch = require('node-fetch');
const firebaseEncode = require('../lib/firebase-encode');
const { addBuild } = require('../src/add-build');
const { deleteRepo } = require('../lib/deleter');
const client = require('../src/firestore');

const repos = {
  repoId: 'org1/repo1',
  organization: 'org1',
  name: 'repo1',
  searchindex: 0,
  lastupdate: moment.utc('2000-01-01').toDate(),
  lower: {
    organization: 'org1',
    name: 'repo1',
    repoId: 'org1/repo1'
  }
};

// 3 builds in 2 days
const builds = [
  // 2 builds in 2000-01-01 @ 01:00 am
  {
    repoId: firebaseEncode(repos.repoId),
    organization: 'org1',
    name: 'repo1',
    buildId: '1',
    timestamp: moment.utc('2000-01-01 01:00').toDate(),
    sha: uuidv4(),
    url: 'https://github.com/org1/repo1',
    environment: {
      os: 'linux-banana',
      matrix: JSON.stringify({ 'node-version': 12.0 }),
      ref: 'master',
      tag: 'tag1'
    },
    testCases: [],
    description: 'a repository',
    buildmessage: 'Workflow - 2'
  },
  {
    repoId: firebaseEncode(repos.repoId),
    organization: 'org1',
    name: 'repo1',
    buildId: '2',
    timestamp: moment.utc('2000-01-01 01:00').toDate(),
    sha: uuidv4(),
    url: 'https://github.com/org1/repo1',
    environment: {
      os: 'windows-peach',
      matrix: JSON.stringify({ 'node-version': 14.0 }),
      ref: 'dev',
      tag: 'tag2'
    },
    testCases: [],
    description: 'a repository',
    buildmessage: 'Workflow - 2'
  },

  // 1 build in 2000-01-02 @ 01:00 pm
  {
    repoId: firebaseEncode(repos.repoId),
    organization: 'org1',
    name: 'repo1',
    buildId: '3',
    timestamp: moment.utc('2000-01-02 13:00').toDate(),
    sha: uuidv4(),
    url: 'https://github.com/org1/repo1',
    environment: {
      os: 'windows-peach',
      matrix: JSON.stringify({ 'node-version': 14.0 }),
      ref: 'dev',
      tag: 'tag2'
    },
    testCases: [],
    description: 'a repository',
    buildmessage: 'Workflow - 2'
  }
];

describe('GetBatchesHandler', () => {
  let clock;

  before(async () => {
    global.headCollection = 'testing/' + Date.now() + '-testing-repos-' + uuidv4() + '/repos';

    await client.collection(global.headCollection).doc(firebaseEncode(repos.repoId)).set(repos);

    for (let buildIndex = 0; buildIndex < builds.length; buildIndex++) {
      const build = builds[buildIndex];
      await addBuild(build.testCases, build, client, global.headCollection);
    }
  });

  describe('fetch all batches', () => {
    const assertBuildsInBatch = (batch, _builds) => {
      _builds.forEach(build => {
        const batchTime = moment.unix(batch.timestamp);
        const buildTime = moment.utc(build.timestamp);
        assert(batchTime.isSame(buildTime, 'day'));
      });
    };

    it('should return all batches for a repo', async () => {
      clock = sinon.useFakeTimers(moment.utc('2000-11-11').toDate());

      const resp = await fetch('http://localhost:3000/api/repo/org1/repo1/batches');
      clock.tick(1);

      const respBatches = await resp.json();
      clock.tick(1);

      assert.strictEqual(respBatches.length, 2); // 2 days

      assertBuildsInBatch(respBatches[0], builds.slice(0, 2));
      assertBuildsInBatch(respBatches[1], builds.slice(2, 3));
    });

    it('should return an empty array if the repository does not exist', async () => {
      clock = sinon.useFakeTimers(moment.utc('2000-11-11').toDate());
      const fakeOrg = 'org' + uuidv4();
      const resp = await fetch('http://localhost:3000/api/repo/' + fakeOrg + '/repo1/batches');
      clock.tick(1);

      const respBatches = await resp.json();
      clock.tick(1);

      assert.strictEqual(respBatches.length, 0);
    });

    it('should use UTC when no utc offset was provided', async () => {
      clock = sinon.useFakeTimers(moment.utc('2000-11-12').toDate());

      const resp = await fetch('http://localhost:3000/api/repo/org1/repo1/batches');
      clock.tick(1);

      const respBatches = await resp.json();
      clock.tick(1);

      assert.strictEqual(respBatches.length, 1);

      assertBuildsInBatch(respBatches[0], builds.slice(2, 3));
    });

    it('should use the provided utc offset', async () => {
      clock = sinon.useFakeTimers(moment.utc('2000-11-12').toDate());

      const utcOffset = -1;
      const resp = await fetch('http://localhost:3000/api/repo/org1/repo1/batches?utcOffset=' + utcOffset);
      clock.tick(1);

      const respBatches = await resp.json();
      clock.tick(1);

      assert.strictEqual(respBatches.length, 2); // 2 days

      assertBuildsInBatch(respBatches[0], builds.slice(0, 2));
      assertBuildsInBatch(respBatches[1], builds.slice(2, 3));
    });

    it('should return a bad request error if the query contains an invalid matrix', async () => {
      clock = sinon.useFakeTimers(moment.utc('2000-11-11').toDate());
      const matrix = 'unknown';

      const resp = await fetch('http://localhost:3000/api/repo/org1/repo1/batches?matrix=' + matrix);
      clock.tick(1);

      const respObj = await resp.json();
      clock.tick(1);

      assert.strictEqual(respObj.error, 'Bad Request');
    });

    it('should filter by matrix', async () => {
      clock = sinon.useFakeTimers(moment.utc('2000-11-11').toDate());
      const matrix = '%7B"node-version":12%7D';

      const resp = await fetch('http://localhost:3000/api/repo/org1/repo1/batches?matrix=' + matrix);
      clock.tick(1);

      const respBatches = await resp.json();
      clock.tick(1);

      assert.strictEqual(respBatches.length, 1);
      assertBuildsInBatch(respBatches[0], builds.slice(0, 1));
    });

    it('should filter by reference', async () => {
      clock = sinon.useFakeTimers(moment.utc('2000-11-11').toDate());
      const ref = 'master';

      const resp = await fetch('http://localhost:3000/api/repo/org1/repo1/batches?ref=' + ref);
      clock.tick(1);

      const respBatches = await resp.json();
      clock.tick(1);

      assert.strictEqual(respBatches.length, 1);
      assertBuildsInBatch(respBatches[0], [builds[0]]);
    });

    it('should filter by operating system', async () => {
      clock = sinon.useFakeTimers(moment.utc('2000-11-11').toDate());
      const os = 'windows-peach';

      const resp = await fetch('http://localhost:3000/api/repo/org1/repo1/batches?os=' + os);
      clock.tick(1);

      const respBatches = await resp.json();
      clock.tick(1);

      assert.strictEqual(respBatches.length, 2);
      assertBuildsInBatch(respBatches[0], [builds[1]]);
      assertBuildsInBatch(respBatches[1], [builds[2]]);
    });

    it('should filter by tag', async () => {
      clock = sinon.useFakeTimers(moment.utc('2000-11-11').toDate());
      const tag = 'tag1';

      const resp = await fetch('http://localhost:3000/api/repo/org1/repo1/batches?tag=' + tag);
      clock.tick(1);

      const respBatches = await resp.json();
      clock.tick(1);

      assert.strictEqual(respBatches.length, 1);
      assertBuildsInBatch(respBatches[0], builds.slice(0, 1));
    });

    afterEach(() => clock.restore());
  });

  describe('fetch single batch', () => {
    let timestamp;
    beforeEach(() => {
      clock = sinon.useFakeTimers();
      timestamp = moment.utc('2000-01-01').unix();
    });
    afterEach(() => clock.restore());

    it('should return a batch with all builds for the specified day', async () => {
      const resp = await fetch('http://localhost:3000/api/repo/org1/repo1/batch/' + timestamp);
      clock.tick(1);

      const _builds = await resp.json();
      clock.tick(1);

      assert.strictEqual(_builds.length, 2);
      assert(_builds.find(build => build.sha === builds[0].sha));
      assert(_builds.find(build => build.sha === builds[1].sha));
    });

    it('should return an empty batch if no build exist', async () => {
      timestamp = moment.utc('2000-01-05').unix();
      const resp = await fetch('http://localhost:3000/api/repo/org1/repo1/batch/' + timestamp);
      clock.tick(1);

      const _builds = await resp.json();
      clock.tick(1);

      assert.strictEqual(_builds.length, 0);
    });

    it('should return a bad request error if the query contains an invalid matrix', async () => {
      const matrix = 'unknown';

      const resp = await fetch('http://localhost:3000/api/repo/org1/repo1/batch/' + timestamp + '?matrix=' + matrix);
      clock.tick(1);

      const respObj = await resp.json();
      clock.tick(1);

      assert.strictEqual(respObj.error, 'Bad Request');
    });

    it('should filter by matrix', async () => {
      const matrix = '%7B"node-version":14%7D';

      const resp = await fetch('http://localhost:3000/api/repo/org1/repo1/batch/' + timestamp + '?matrix=' + matrix);
      clock.tick(1);

      const _builds = await resp.json();
      clock.tick(1);

      assert.strictEqual(_builds.length, 1);
      assert.strictEqual(_builds[0].sha, builds[1].sha);
    });

    it('should filter by reference', async () => {
      const ref = 'dev';

      const resp = await fetch('http://localhost:3000/api/repo/org1/repo1/batch/' + timestamp + '?ref=' + ref);
      clock.tick(1);

      const _builds = await resp.json();
      clock.tick(1);

      assert.strictEqual(_builds.length, 1);
      assert.strictEqual(_builds[0].sha, builds[1].sha);
    });

    it('should filter by operating system', async () => {
      const os = 'windows-peach';

      const resp = await fetch('http://localhost:3000/api/repo/org1/repo1/batch/' + timestamp + '?os=' + os);
      clock.tick(1);

      const _builds = await resp.json();
      clock.tick(1);

      assert.strictEqual(_builds.length, 1);
      assert.strictEqual(_builds[0].sha, builds[1].sha);
    });

    it('should filter by tag', async () => {
      const tag = 'tag2';

      const resp = await fetch('http://localhost:3000/api/repo/org1/repo1/batch/' + timestamp + '?tag=' + tag);
      clock.tick(1);

      const _builds = await resp.json();
      clock.tick(1);

      assert.strictEqual(_builds.length, 1);
      assert.strictEqual(_builds[0].sha, builds[1].sha);
    });

    it('should return a bad request error if the query contains an invalid timestamp', async () => {
      const expectBadRequest = async (_timestamp) => {
        const resp = await fetch('http://localhost:3000/api/repo/org1/repo1/batch/' + _timestamp);
        clock.tick(1);
        const respObj = await resp.json();
        clock.tick(1);
        assert.strictEqual(respObj.error, 'Bad Request');
      };

      const invalidTimestamps = ['bad timestamp', -1, 'undefined', 'null'];

      for (let k = 0; k < invalidTimestamps.length; k++) { await expectBadRequest(invalidTimestamps[k]); }
    });
  });

  after(async () => {
    await deleteRepo(repos.repoId, client);
  });
});
