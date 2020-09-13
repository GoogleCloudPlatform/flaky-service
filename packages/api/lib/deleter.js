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

// class to receive POSTS with build information

const firebaseEncode = require('./firebase-encode');
const { updateRepoStats } = require('../src/update-repo-stats');

async function deleteRepo (repoId, client) {
  const deleteOperations = [];

  const allBuilds = await client.collection(global.headCollection).doc(firebaseEncode(repoId)).collection('builds').get();
  allBuilds.forEach(build => {
    deleteOperations.push(build.ref.delete());
  });

  const allTests = await client.collection(global.headCollection).doc(firebaseEncode(repoId)).collection('tests').get();
  allTests.forEach(test => {
    deleteOperations.push(deleteTest(repoId, test.data().name, client));
  });

  deleteOperations.push(client.collection(global.headCollection).doc(firebaseEncode(repoId)).delete());

  await Promise.all(deleteOperations);
}

// this does not delete the tests names stored in a list under a specific build. These names should not be used without first looking
// in the test collection to verify that the test does indeed exist
async function deleteTest (repoIdRaw, testname, client) {
  const repoId = firebaseEncode(repoIdRaw);
  const deleteOperations = [];
  const allRuns = await client.collection(global.headCollection).doc(repoId).collection('queued').doc(firebaseEncode(testname)).collection('runs').get();
  allRuns.forEach(async (run) => {
    deleteOperations.push(run.ref);
  });
  for (const operation of deleteOperations) {
    await operation.delete();
  }
  await client.collection(global.headCollection).doc(repoId).collection('queued').doc(firebaseEncode(testname)).delete();
  await updateRepoStats(repoId, client);
}

module.exports = { deleteTest, deleteRepo };
