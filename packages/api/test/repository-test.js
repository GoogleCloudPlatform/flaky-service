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
  before(async () => {
    repo = new Repository();
    await repo.create('test-repos-doc/collection-of-repos/firstRepo', {
      repositoryid: 'this is the first repo'
    });
    await repo.create('test-repos-doc/collection-of-repos/secondRepo', {
      repositoryid: 'this is the second repo'
    });
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
      let result = await repo.getCollection('repositories/test-repos-doc/collection-of-repos');
      //TODO: this test relies on a specific document in a specific repo. Fix this.
      var shouldMatchSolution = [{'repositoryid':'this is the first repo'}, {'repositoryid':'this is the second repo'}];
      assert.deepEqual(result, shouldMatchSolution);
    })
  })
  after(async () => {
    await repo.delete('my-first-repository');
    await repo.delete('test-repos-doc');
  });
});
