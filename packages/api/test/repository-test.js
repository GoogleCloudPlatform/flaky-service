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
const Repository = require('../src/repository');
const assert = require('assert');

describe('Repository', () => {
  let repo;
  before(async () => {
    repo = new Repository();
  });

  describe('createDoc', async () => {
    it('creates a new document', async () => {
      await repo.createDoc('dummy/my-first-repository', {
        description: 'this is my first test repository'
      });
      // TODO: use a unique name for this document, using the uuid library,
      // so that two folks can run tests at the same time without colliding.
      const doc = await repo.getDoc('dummy/my-first-repository');
      assert.strictEqual(doc.description, 'this is my first test repository');
      await repo.deleteDoc('dummy/my-first-repository');
    });
  });

  describe('getDoc', async () => {
    it('gets a document that exists', async () => {
      await repo.createDoc('dummy/fake-doc', {
        info: 'hello this is for testing'
      });
      const data = await repo.getDoc('dummy/fake-doc');
      assert.deepStrictEqual(data.info, 'hello this is for testing');
      await repo.deleteDoc('dummy/fake-doc');
    });
  });

  describe('allRepositories', async () => {
    it('retrieves the contents of a collection', async () => {
      const result = await repo.getCollection('repositories/test-repos-doc/collection-of-repos');
      // TODO: what happens when a document in the collection contains a collection?
      const shouldMatchSolution = [{ repositoryid: 'this is the first repo' }, { repositoryid: 'this is the second repo' }];
      assert.deepStrictEqual(result, shouldMatchSolution);
    });
    it('returns empty array if the collection does not exist', async () => {
      const result = await repo.getCollection('nonexistent');
      assert.deepStrictEqual(result, []);
    });
  });

  describe('mayAccess', async () => {
    it('returns false if a user is not permitted to log in via Github', async () => {
      const permitted = await repo.mayAccess('github', 'fake');
      assert.strictEqual(permitted, false);
    });

    it('returns true if a user is permitted to log into via Github', async () => {
      const permitted = await repo.mayAccess('github', 'cedpeters');
      assert.strictEqual(permitted, true);
    });
  });

  describe('sessionPermissions', async () => {
    it('returns not permitted if the session id does not exist', async () => {
      const permission = await repo.sessionPermissions('test-session-nonexistent');
      assert.deepStrictEqual(permission, { permitted: false, expiration: null, login: null });
    });

    it('returns not permitted if there is no expiration date', async () => {
      await repo.createDoc('express-sessions/test-session', {});
      const permission = await repo.sessionPermissions('test-session');
      assert.deepStrictEqual(permission, { permitted: false, expiration: null, login: null });
      await repo.deleteDoc('express-sessions/test-session');
    });

    it('returns not permitted if the expiration date is in the past');
  });
});
