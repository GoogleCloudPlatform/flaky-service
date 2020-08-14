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

const firebaseEncode = require('../lib/firebase-encode');

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
async function deleteTest (repoId, testname, client) {
  const deleteOperations = [];
  const allRuns = await client.collection(global.headCollection).doc(firebaseEncode(repoId)).collection('tests').doc(firebaseEncode(testname)).collection('runs').get();
  allRuns.forEach(run => {
    deleteOperations.push(run.ref.delete());
  });
  deleteOperations.push(client.collection(global.headCollection).doc(firebaseEncode(repoId)).collection('tests').doc(firebaseEncode(testname)).delete());
  await Promise.all(deleteOperations);
}

module.exports = { deleteTest, deleteRepo };
