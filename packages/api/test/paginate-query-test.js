
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

const { describe, before, after, it } = require('mocha');
const { Firestore } = require('@google-cloud/firestore');
const { v4: uuidv4 } = require('uuid');
const firebaseEncode = require('../lib/firebase-encode');

const assert = require('assert');
const fetch = require('node-fetch');

const data = [
  // name, org
  ['aa', 'alpha'],
  ['ab', 'alpha'],
  ['ac', 'alpha'],
  ['b', 'alpha'],
  ['z', 'wrong']
];

async function assertQueryResults (query, results) {
  const resp = await fetch(query);
  const respText = await resp.text();
  const respJson = JSON.parse(respText);

  assert.strictEqual(results.length, respJson.length);
  for (let i = 0; i < results.length; i++) {
    assert.strictEqual(results[i], respJson[i].lower.name);
  }
}
describe('Getting Repos and Orgs', () => {
  let client;
  before(async () => {
    client = new Firestore({
      projectId: process.env.FLAKY_DB_PROJECT || 'flaky-dev-development'
    });
    global.headCollection = 'repositories-testsuite-' + uuidv4();
    global.headCollection += '/allinfo/repositories';

    for (let k = 0; k < data.length; k++) {
      const repo = data[k];
      const repoid = repo[1] + '/' + repo[0];
      await client.collection(global.headCollection).doc(firebaseEncode(repoid)).set({
        organization: repo[1],
        name: repo[0],
        repoId: repoid,
        lower: {
          organization: repo[1].toLowerCase(),
          name: repo[0].toLowerCase(),
          repoId: repoid.toLowerCase()
        }
      });
    }
  });

  it('paginate forward and backwards with a search string', async () => {
    // fowards
    await assertQueryResults('http://localhost:3000/api/repo?org=alpha&startswith=a&limit=2', ['aa', 'ab']);
    await assertQueryResults('http://localhost:3000/api/repo?org=alpha&startswith=a&limit=2&startaftername=ab', ['ac']);

    // backwards
    await assertQueryResults('http://localhost:3000/api/repo?org=alpha&startswith=a&limit=2&endbeforename=ac', ['aa', 'ab']);
  });

  it('paginate forward and backwards without a search string', async () => {
    // forwards
    await assertQueryResults('http://localhost:3000/api/repo?org=alpha&limit=2', ['aa', 'ab']);
    await assertQueryResults('http://localhost:3000/api/repo?org=alpha&limit=2&startaftername=ab', ['ac', 'b']);

    // backwards
    await assertQueryResults('http://localhost:3000/api/repo?org=alpha&limit=2&endbeforename=ac', ['aa', 'ab']);
  });

  it('handle a single result', async () => {
    await assertQueryResults('http://localhost:3000/api/repo?org=wrong&limit=2', ['z']);
  });

  it('returns empty list if out of bounds', async () => {
    await assertQueryResults('http://localhost:3000/api/repo?org=alpha&startswith=a&limit=2&endbeforename=aa', []);
    await assertQueryResults('http://localhost:3000/api/repo?org=alpha&startswith=a&limit=2&startaftername=ac', []);
  });

  it('errors if incorrect request', async () => {
    const resp = await fetch('http://localhost:3000/api/repo');
    assert.strictEqual(resp.status, 400); // needs org parameter

    const resp2 = await fetch('http://localhost:3000/api/repo?limit=NOTANINT');
    assert.strictEqual(resp2.status, 400); // needs org parameter
  });

  after(async () => {
    for (let k = 0; k < data.length; k++) {
      const repo = data[k];
      const repoid = repo[1] + '/' + repo[0];
      await client.collection(global.headCollection).doc(firebaseEncode(repoid)).delete();
    }
  });
});
