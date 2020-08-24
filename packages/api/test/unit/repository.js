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
const repo = require('../../src/repository');
const assert = require('assert');
const sinon = require('sinon');
const deleter = require('../../lib/deleter.js');

describe('Repository', () => {
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
