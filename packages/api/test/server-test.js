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

const assert = require('assert');
const fetch = require('node-fetch');

describe('flaky express server', () => {
  // let server;
  before(() => {
    const serverModule = require('../server');
    // server = serverModule.server;
  });
  it('it responds to a GET on the / path', async () => {
    const resp = await fetch('http://localhost:3000', {
      method: 'post',
      body: JSON.stringify({
        message: 'goodnight moon'
      }),
      headers: { 'Content-Type': 'application/json' }
    });
    const respJSON = await resp.json();
    assert.strictEqual(respJSON.message, 'goodnight moon');
  });

  it('it returns a json object with the list of repositories, when you call GET on /repos', async () => {
    const resp = await fetch('http://localhost:3000/repos', {});
    var sol = ['firstRepo', 'fourthRepo', 'secondRepo', 'thirdRepo'];
    const respJSON = await resp.json()
    assert.deepEqual(respJSON.repoNames, sol);
  });
  
  it('it returns a single repository, when you call GET on /repository/:id');
  it('it creates a repository, when you call POST on /repository');
  after(() => {
    // server.close();
  });
});