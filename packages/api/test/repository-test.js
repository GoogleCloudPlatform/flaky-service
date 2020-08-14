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

const { describe, it, beforeEach, afterEach } = require('mocha');
const repo = require('../src/repository');
const assert = require('assert');
const { v4 } = require('uuid');
const sinon = require('sinon');
const deleter = require('../lib/deleter.js');

describe('Repository', () => {
  let uniqueString;
  beforeEach(() => {
    uniqueString = v4();
  });
  describe('createDoc', async () => {
    it('creates a new document', async () => {
      await repo.createDoc(`dummy/${uniqueString}`, {
        description: 'this is my first test repository'
      });
      const doc = await repo.getDoc(`dummy/${uniqueString}`);
      assert.strictEqual(doc.description, 'this is my first test repository');
      await repo.deleteDoc(`dummy/${uniqueString}`);
    });
  });

  describe('getDoc', async () => {
    it('gets a document that exists', async () => {
      await repo.createDoc(`dummy/${uniqueString}`, {
        info: 'hello this is for testing'
      });
      const data = await repo.getDoc(`dummy/${uniqueString}`);
      assert.deepStrictEqual(data.info, 'hello this is for testing');
      await repo.deleteDoc(`dummy/${uniqueString}`);
    });

    it('returns null when a document does not exist', async () => {
      const data = await repo.getDoc('doesnt-exist/super-fake');
      assert.deepStrictEqual(data, null);
    });
  });

  describe('getCollection', async () => {
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

  describe('ticket handlers', async () => {
    let state;
    const ticket = {
      data: 'fake data'
    };
    beforeEach(() => {
      state = v4();
      ticket.state = state;
    });
    describe('storeTicket', async () => {
      it('stores a ticket which has a state', async () => {
        // Store ticket
        await repo.storeTicket(ticket);

        // Retrieve ticket, check it
        const result = await repo.getDoc(`tickets/${state}`);
        assert.deepStrictEqual(result.ticket, ticket);

        // Delete ticket
        await repo.deleteDoc(`tickets/${state}`);
      });
    });

    describe('getTicket', async () => {
      it('retrieves a ticket by its state', async () => {
        await repo.createDoc(`tickets/${state}`, {
          ticket: ticket
        });

        const result = await repo.getTicket(state);

        assert.deepStrictEqual(result, ticket);

        await repo.deleteDoc(`tickets/${state}`);
      });
    });
  });

  describe('allowedToPerformTicket', async () => {
    it('returns true when user has write permission to repo and attempts to delete a test', async () => {
      const result = await repo.allowedToPerformTicket('delete-test', 'write');
      assert.deepStrictEqual(result, true);
    });
    it('returns true when user has admin permission to repo and attempts to delete a test', async () => {
      const result = await repo.allowedToPerformTicket('delete-test', 'admin');
      assert.deepStrictEqual(result, true);
    });
    it('returns false when user has write permission to repo and attempts to delete a repo', async () => {
      const result = await repo.allowedToPerformTicket('delete-repo', 'write');
      assert.deepStrictEqual(result, false);
    });
    it('returns true when user has admin permission to repo and attempts to delete a repo', async () => {
      const result = await repo.allowedToPerformTicket('delete-repo', 'admin');
      assert.deepStrictEqual(result, true);
    });
  });

  describe('performTicketIfAllowed', async () => {
    let stubbedPermissions;
    let stubbedTestDeletion;
    let stubbedRepoDeletion;

    beforeEach(() => {
      stubbedPermissions = sinon.stub(repo, 'allowedToPerformTicket').callsFake((action, permission) => {
        // permission would normally be write, admin, etc. For this mock just setting to 'permitted' or other for the purpose of testing.
        if (permission === 'permitted') return true;
        return false;
      });

      stubbedTestDeletion = sinon.stub(deleter, 'deleteTest');
      stubbedRepoDeletion = sinon.stub(deleter, 'deleteRepo');
    });

    afterEach(() => {
      stubbedPermissions.restore();
      stubbedTestDeletion.restore();
      stubbedRepoDeletion.restore();
    });

    it('deletes test if permitted', async () => {
      await repo.performTicketIfAllowed({ action: 'delete-test', fullName: 'org/repo', testName: 'test' }, 'permitted');

      assert(stubbedTestDeletion.calledWith('org/repo', 'test'));
    });

    it('does not delete test if not permitted', async () => {
      await repo.performTicketIfAllowed({ action: 'delete-test', fullName: 'org/repo', testName: 'test' }, 'notPermitted');

      // stubbedTestDeletion is called once by other test, but should never be called more than once.
      assert(stubbedTestDeletion.callCount === 0);
    });

    it('deletes repo if permitted', async () => {
      await repo.performTicketIfAllowed({ action: 'delete-repo', fullName: 'org/repo' }, 'permitted');

      assert(stubbedRepoDeletion.calledWith('org/repo'));
    });

    it('does not delete repo if not permitted', async () => {
      await repo.performTicketIfAllowed({ action: 'delete-test', fullName: 'org/repo' }, 'notPermitted');

      // stubbedTestDeletion is called once by other test, but should never be called more than once.
      assert(stubbedRepoDeletion.callCount === 0);
    });
  });
});
