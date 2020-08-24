
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
const { v4: uuidv4 } = require('uuid');
const firebaseEncode = require('../lib/firebase-encode');
const client = require('../src/firestore.js');

const assert = require('assert');
const fetch = require('node-fetch');

const data = [
  // name, org
  ['aaaname', 'aaa'],
  ['aaabeta', 'aaa'], // same organization, different repo
  ['org', 'aaaname'], // repo with same name as org
  ['123', '456'], // test numbers
  ['z', 'bigorg'],
  ['z9', 'bigorg'],
  ['zZ', 'bigorg'],
  ['za', 'bigorg'],
  ['UPPER', 'UPPER'],
  ['lower', 'lower']
];

describe('Getting Repos and Orgs', () => {
  before(async () => {
    global.headCollection = 'testing/' + Date.now() + '-testing-repos-' + uuidv4() + '/repos';

    for (let k = 0; k < data.length; k++) {
      const repo = data[k];
      const repoid = repo[1] + '/' + repo[0];
      var d = new Date();
      d.setDate(d.getDate() + k);
      await client.collection(global.headCollection).doc(firebaseEncode(repoid)).set({
        organization: repo[1],
        name: repo[0],
        repoId: repoid,
        lower: {
          organization: repo[1].toLowerCase(),
          name: repo[0].toLowerCase(),
          repoId: repoid.toLowerCase()
        },
        searchindex: k,
        lastupdate: d
      });
    }
  });

  it('should respond with an empty list with random queries', async () => {
    const resp = await fetch('http://localhost:3000/api/repo?org=ddd&startswith=randomquery');
    const respText = await resp.text();
    assert.strictEqual(JSON.parse(respText).length, 0);

    const respOrg = await fetch('http://localhost:3000/api/org/randomquery');
    const respTextOrg = await respOrg.text();

    assert.strictEqual(JSON.parse(respTextOrg).repos.length, 0);
  });

  it('should return all results no matter the next characters', async () => {
    const resp = await fetch('http://localhost:3000/api/repo?org=bigorg&startswith=z');
    const respText = await resp.text();
    assert.strictEqual(JSON.parse(respText).length, 4);
  });

  it('should not work with a name too long', async () => {
    const resp = await fetch('http://localhost:3000/api/repo?org=aaa&startswith=aaanamelengthen');
    const respText = await resp.text();
    assert.strictEqual(JSON.parse(respText).length, 0);
  });

  it('find all repos for one org', async () => {
    const resp = await fetch('http://localhost:3000/api/org/bigorg');
    const respText = await resp.text();
    assert.strictEqual(JSON.parse(respText).repos.length, 4);
    assert.strictEqual(JSON.parse(respText).hasnext, false);
    assert.strictEqual(JSON.parse(respText).hasprev, false);
  });

  it('can sort within org based on date', async () => {
    const resp = await fetch('http://localhost:3000/api/org/bigorg?orderby=activity');
    const respText = await resp.text();
    const parsed = JSON.parse(respText).repos;
    assert.strictEqual(parsed.length, 4);
    assert.strictEqual(parsed[0].lower.name, 'za');
    assert.strictEqual(parsed[3].lower.name, 'z');
  });

  it('can sort within org based on priority', async () => {
    const resp = await fetch('http://localhost:3000/api/org/bigorg?orderby=priority');
    const respText = await resp.text();
    const parsed = JSON.parse(respText).repos;
    assert.strictEqual(parsed.length, 4);
    assert.strictEqual(parsed[0].lower.name, 'za');
    assert.strictEqual(parsed[3].lower.name, 'z');
  });

  it('can sort within org by name', async () => {
    const resp = await fetch('http://localhost:3000/api/org/bigorg?orderby=name');
    const respText = await resp.text();
    const parsed = JSON.parse(respText).repos;
    assert.strictEqual(parsed.length, 4);
    assert.strictEqual(parsed[0].lower.name, 'z');
    assert.strictEqual(parsed[3].lower.name, 'zz');
  });

  it('still orders by name if startswith parameter', async () => {
    const resp = await fetch('http://localhost:3000/api/org/bigorg?startswith=z&orderby=priority');
    const respText = await resp.text();
    const parsed = JSON.parse(respText).repos;
    assert.strictEqual(parsed.length, 4);
    assert.strictEqual(parsed[0].lower.name, 'z');
    assert.strictEqual(parsed[3].lower.name, 'zz');
  });

  it('can use offset parameters on org sesarch', async () => {
    const resp = await fetch('http://localhost:3000/api/org/bigorg?offset=2');
    const respText = await resp.text();
    const parsedResp = JSON.parse(respText);
    assert.strictEqual(parsedResp.repos.length, 2);
    assert.strictEqual(parsedResp.hasnext, false);
    assert.strictEqual(parsedResp.hasprev, true);
  });

  it('can correctly use hasnext when there is more', async () => {
    const resp = await fetch('http://localhost:3000/api/org/bigorg?offset=1&limit=1');
    const respText = await resp.text();
    const parsedResp = JSON.parse(respText);
    assert.strictEqual(parsedResp.repos.length, 1);
    assert.strictEqual(parsedResp.hasnext, true);
  });

  it('limit search (only on repos)', async () => {
    const resp = await fetch('http://localhost:3000/api/repo?org=bigorg&startswith=z&limit=3');
    const respText = await resp.text();
    assert.strictEqual(JSON.parse(respText).length, 3);
  });

  it('should return all with no startswith', async () => {
    const resp = await fetch('http://localhost:3000/api/repo?org=bigorg');
    const respText = await resp.text();
    assert.strictEqual(JSON.parse(respText).length, 4);
  });

  it('should work with case insensitive', async () => {
    const resp = await fetch('http://localhost:3000/api/repo?org=upper&startswith=upper');
    const respText = await resp.text();
    assert.strictEqual(JSON.parse(respText).length, 1);

    const resp2 = await fetch('http://localhost:3000/api/repo?org=LOWER&startswith=LOWER');
    const respText2 = await resp2.text();

    assert.strictEqual(JSON.parse(respText2).length, 1);
  });

  after(async () => {
    for (let k = 0; k < data.length; k++) {
      const repo = data[k];
      const repoid = repo[1] + '/' + repo[0];
      await client.collection(global.headCollection).doc(firebaseEncode(repoid)).delete();
    }
  });
});
