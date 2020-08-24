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

const { before, after } = require('mocha');
const client = require('../src/firestore.js');
const firebaseTools = require('firebase-tools');

let server;
before(() => {
  server = require('../server');
});

after(async () => {
  await cleanupStaleTestData();
  server.close();
});

// After 2 minutes, delete any collections in the testing/ collection:
const CLEANUP_AFTER = 120000; // Cleanup stale data after N ms.
const TEST_DB = 'testing';
async function cleanupStaleTestData () {
  const now = Date.now();
  try {
    const testDocs = await client
      .collection(TEST_DB)
      .listDocuments();
    for (const testDoc of testDocs) {
      const test = await testDoc.get();
      console.info(`collection ${test.ref.path}`);
      const msStr = test.ref.path.split('-')[0].replace(`${TEST_DB}/`, '');
      if ((now - Number(msStr)) > CLEANUP_AFTER) {
        console.info(`deleting ${test.ref.path}`);
        await firebaseTools.firestore
          .delete(test.ref.path, {
            project: process.env.GCLOUD_PROJECT,
            recursive: true,
            yes: true
          });
      }
    }
  } catch (err) {
    console.warn(err);
  }
}
