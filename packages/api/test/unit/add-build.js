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

const { afterEach, beforeEach, describe, it } = require('mocha');
const api = require('../../src/add-build');
const sandbox = require('sinon').createSandbox();

// Fakes fetching the previous test from database:
function getPreviousTestDB (testCase) {
  return {
    collection: () => {
      return {
        doc: () => {
          return {
            get: () => {
              return testCase;
            }
          };
        }
      };
    }
  };
}

describe('AddBuild', () => {
  describe('updateQueue', () => {
    beforeEach(function () {
      sandbox.stub(api, 'addTestRun');
      sandbox.stub(api, 'updateTest');
    });

    afterEach(function () {
      sandbox.restore();
    });

    it('stores test run information for first test, if it is a failure', async () => {
      const testCase = {
        successful: false
      };
      const buildInfo = {};
      const db = getPreviousTestDB({ exists: false });
      await api.updateQueue(false, testCase, buildInfo, db);
      sandbox.assert.calledOnce(api.addTestRun);
      sandbox.assert.calledOnce(api.updateTest);
    });

    it('stores test run information for the first build', async () => {
      const testCase = {
        successful: true
      };
      const buildInfo = {};
      const db = getPreviousTestDB({ exists: false });
      await api.updateQueue(true, testCase, buildInfo, db);
      sandbox.assert.calledOnce(api.addTestRun);
      sandbox.assert.calledOnce(api.updateTest);
    });

    it('stores test run information if there are not enough subsequent passes', async () => {
      const testCase = {
        successful: true
      };
      const buildInfo = {};
      const db = getPreviousTestDB({
        exists: true,
        data: () => {
          return {
            subsequentpasses: 7,
            hasfailed: true
          };
        }
      });
      await api.updateQueue(false, testCase, buildInfo, db);
      sandbox.assert.calledOnce(api.addTestRun);
      sandbox.assert.calledOnce(api.updateTest);
    });

    it('does not store test run information after enough subsequent tests pass', async () => {
      const testCase = {
        successful: true
      };
      const buildInfo = {};
      const db = getPreviousTestDB({
        exists: true,
        data: () => {
          return {
            subsequentpasses: 15
          };
        }
      });
      await api.updateQueue(false, testCase, buildInfo, db);
      sandbox.assert.notCalled(api.addTestRun);
      sandbox.assert.notCalled(api.updateTest);
    });
  });
});
