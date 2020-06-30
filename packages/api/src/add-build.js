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

/*
* Code to add a build including test cases
* Updates the analytics for the modified test cases
* and builds
* returns analytics object and adds such data to database
*/
const { Firestore } = require('@google-cloud/firestore');
const { buildPassingPercent, TestCaseAnalytics } = require('../lib/analytics.js');

function listifySnapshot (snapshot) {
  const results = [];
  snapshot.forEach(doc => {
    results.push(doc.data());
  });
  return results;
}

// Main Functionality

/*
* Adds a list of TestCaseRun objects to the database, described by the meta information in buildInfo
*       Does not assume repository has been initialized
*       Particular build MAY NOT be added multiple times with different information, but may be added multiple times with same info
* @param buildInfo must have attributes of organization, timestamp, url, environment, buildId
* @param client is the firebase client
* @param collectionName is the collection to use in firestore
*
*/
async function addBuild (testCases, buildInfo, client, collectionName = 'repositories-fake') {
  var dbRepo = client.collection(collectionName).doc(buildInfo.repoId);

  // if this build is not the most recent build, than update test cases based on ALL repos, update build info based on RPREVIOUS builds, and ignore repo
  let mostRecent = true;
  let prevMostRecent = await dbRepo.collection('builds').orderBy('timestamp', 'desc').limit(1).get();
  prevMostRecent = listifySnapshot(prevMostRecent);
  if (prevMostRecent.length > 0 && prevMostRecent[0].timestamp.toDate() > buildInfo.timestamp) {
    // if there exists a build with a later date, that not the most recent
    mostRecent = false;
  }

  // if repo does not exist, add information including environment variables and possibilities
  const repoUpdate = { };
  for (const prop in buildInfo.environment) {
    repoUpdate['environments.' + prop] = Firestore.FieldValue.arrayUnion(buildInfo.environment[prop]);
  }
  repoUpdate.organization = buildInfo.organization;
  repoUpdate.url = buildInfo.url;
  repoUpdate.repoId = decodeURIComponent(buildInfo.repoId);
  repoUpdate.name = buildInfo.name;
  repoUpdate.lower = {
    repoId: decodeURIComponent(buildInfo.repoId).toLowerCase(),
    name: buildInfo.name.toLowerCase(),
    organization: buildInfo.organization.toLowerCase()
  };
  if (mostRecent) {
    repoUpdate.numtestcases = testCases.length;
    repoUpdate.numfails = 0;
    testCases.forEach(tc => {
      repoUpdate.numfails += (tc.successful) ? 0 : 1;
    });
  }
  await dbRepo.update(repoUpdate, { merge: true });

  var failures = {};
  var successes = [];

  let flakyBuild = 0; // if a flaky test has failed this time
  let flakyRepo = 0; // if any test is marked as flaky (could have been successes for last 5 runs)

  // For the test cases
  for (let k = 0; k < testCases.length; k++) {
    const testCase = testCases[k];
    // track successes and failures in the build
    if (testCase.successful) {
      successes.push(testCase.encodedName);
    } else {
      failures[testCase.encodedName] = testCase.failureMessage;
    }

    // 1: Add the test run
    await dbRepo.collection('tests').doc(testCase.encodedName).collection('runs').doc(buildInfo.buildId).set(
      {
        environment: buildInfo.environment,
        status: testCase.successful ? 'OK' : testCase.failureMessage,
        timestamp: buildInfo.timestamp,
        buildId: decodeURIComponent(buildInfo.buildId), // as value decoded
        sha: decodeURIComponent(buildInfo.sha)
      }
    );

    // 2: Query an appropriate amount of test runs, for now 30 most recent
    const snapshot = await dbRepo.collection('tests').doc(testCase.encodedName).collection('runs').orderBy('timestamp', 'desc').limit(30).get();
    let buildSnapshot = snapshot;
    if (!mostRecent) {
      const dateUse = buildInfo.timestamp;
      // dateUse.setHours(dateUse.getHours() - 2);
      buildSnapshot = await dbRepo.collection('tests').doc(testCase.encodedName).collection('runs').orderBy('timestamp', 'desc').startAt(dateUse).limit(30).get();
    }
    const testCaseAnalytics = new TestCaseAnalytics(testCase, snapshot); // test case metrics should look at everything
    const buildtestCaseAnalytics = new TestCaseAnalytics(testCase, buildSnapshot); // builds should only look previously

    // 3: Compute the passing percent and write that back as well as updated environment variables
    const updateObj = { };
    for (const prop in buildInfo.environment) {
      updateObj['environments.' + prop] = Firestore.FieldValue.arrayUnion(buildInfo.environment[prop]);
    }
    updateObj.percentpassing = testCaseAnalytics.computePassingPercent();
    updateObj.flaky = testCaseAnalytics.computeIsFlaky();
    await dbRepo.collection('tests').doc(testCase.encodedName).update(updateObj, { merge: true });

    // update information for flakybuild and flakyrepo;
    flakyBuild = (buildtestCaseAnalytics.computeIsFlaky() && !testCase.successful) ? 1 + flakyBuild : flakyBuild;
    flakyRepo = (updateObj.flaky) ? 1 + flakyRepo : flakyRepo;
  }

  // For the Builds
  await dbRepo.collection('builds').doc(buildInfo.buildId).set({
    percentpassing: buildPassingPercent(successes, failures),
    environment: buildInfo.environment,
    timestamp: buildInfo.timestamp,
    successes: successes,
    failures: failures,
    sha: decodeURIComponent(buildInfo.sha),
    buildId: decodeURIComponent(buildInfo.buildId),
    flaky: flakyBuild
  });

  // lastly update whether the repo is flaky
  // must update repo information in two steps to first make sure it is there before making queries on it which affect this field

  await dbRepo.update({ flaky: flakyRepo }, { merge: true });
}

module.exports = addBuild;
