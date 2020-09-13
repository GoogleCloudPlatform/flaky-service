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

const AGGREGATE_SIZE = 25;

/*
* Updates the aggregate statistics for a given repository.
*
* @param repoId identifier of repository that requires its aggregate stats updated.
* @param client a firestore client instance.
*/
async function updateRepoStats (repoId, client) {
  const dbRepo = client.collection(global.headCollection).doc(repoId);

  // The top level repository object tracks aggregate test stats from the last
  // AGGREGATE_SIZE test runs:
  const queuedTestLookup = await dbRepo
    .collection('queued')
    .orderBy('searchindex', 'desc')
    .orderBy('lastupdate', 'desc')
    .offset(0)
    .limit(AGGREGATE_SIZE)
    .get();
  const queuedTests = queuedTestLookup.docs.map(doc => doc.data());
  const results = queuedTests.reduce((a, test) => {
    if (!test.passed) {
      a.failing++;
    }
    if (test.flaky) {
      a.flaky++;
    }
    return a;
  }, { flaky: 0, failing: 0 });

  const repoUpdate = {
    flaky: results.flaky,
    numfails: results.failing,
    searchindex: results.failing * 10000 + results.flaky,
    numtestcases: queuedTestLookup.size
  };

  await dbRepo.update(repoUpdate, { merge: true });
}

module.exports = {
  updateRepoStats
};
