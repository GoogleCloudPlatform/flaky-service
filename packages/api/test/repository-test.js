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
const Repository = require('../src/repository');
const assert = require('assert');
const fetch = require('node-fetch');

describe('Repository', () => {
  let repo;
  before(() => {
    repo = new Repository();
  });
  describe('createRepository', async () => {
    it('creates a new repository', async () => {
      await repo.create('my-first-repository', {
        description: 'this is my first test repository'
      });
      // TODO: use a unique name for this document, using the uuid library,
      // so that two folks can run tests at the same time without colliding.
      const repository = await repo.get('my-first-repository');
      assert.strictEqual(repository.description, 'this is my first test repository');
    });
  });
  describe('allRepositories', async () => {
    it('returns the repository JSON', async () => {
      let result = await repo.getCollection('dummy-repositories');
      //TODO: this test relies on a specific document in a specific repo. Fix this.
      assert.strictEqual(result[0].repositoryid, 'firstRepo');
    })
  })
  after(async () => {
    await repo.delete('my-first-repository');
  });
});
