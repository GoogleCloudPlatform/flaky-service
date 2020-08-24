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

const { describe, it, beforeEach } = require('mocha');
const repo = require('../src/repository');
const assert = require('assert');
const { v4 } = require('uuid');

describe('Repository', () => {
  let uniqueString;
  beforeEach(() => {
    uniqueString = `${Date.now()}-${v4()}`;
  });
  describe('createDoc', async () => {
    it('creates a new document', async () => {
      await repo.createDoc(`testing/${uniqueString}`, {
        description: 'this is my first test repository'
      });
      const doc = await repo.getDoc(`testing/${uniqueString}`);
      assert.strictEqual(doc.description, 'this is my first test repository');
      await repo.deleteDoc(`testing/${uniqueString}`);
    });
  });

  describe('getDoc', async () => {
    it('gets a document that exists', async () => {
      await repo.createDoc(`testing/${uniqueString}`, {
        info: 'hello this is for testing'
      });
      const data = await repo.getDoc(`testing/${uniqueString}`);
      assert.deepStrictEqual(data.info, 'hello this is for testing');
      await repo.deleteDoc(`testing/${uniqueString}`);
    });

    it('returns null when a document does not exist', async () => {
      const data = await repo.getDoc('doesnt-exist/super-fake');
      assert.deepStrictEqual(data, null);
    });
  });
});
