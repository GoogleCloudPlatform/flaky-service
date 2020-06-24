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

// ANALYTICS FUNCTIONS

/*
@param snapshot a snapshot with the results of a firestore query
@returns a floating point number representing the percent passing, or -1 if no test cases
*/
function testCasePassingPercent (snapshot) {
  var successCnt = 0;
  var total = 0;
  snapshot.forEach((doc) => {
    successCnt += doc.data().status === 'OK' ? 1 : 0;
    total += 1;
  });
  return (total > 0) ? successCnt / parseFloat(total) : -1;
}

/*
@param successes list of each success
@param failures Object with attributes for each failure
@returns a floating point number representing the percent passing , or -1 if no builds
*/
function buildPassingPercent (successes, failures) {
  var total = successes.length + Object.keys(failures).length;
  return (total > 0) ? successes.length / parseFloat(total) : -1;
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
  await dbRepo.update(repoUpdate, { merge: true });

  var failures = {};
  var successes = [];

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

    // 2: Query an appropriate amount of test runs, for now 100 most recent
    var snapshot = await dbRepo.collection('tests').doc(testCase.encodedName).collection('runs').orderBy('timestamp').limit(100).get();

    // 3: Compute the passing percent and write that back as well as updated environment variables
    const updateObj = { };
    for (const prop in buildInfo.environment) {
      updateObj['environments.' + prop] = Firestore.FieldValue.arrayUnion(buildInfo.environment[prop]);
    }
    updateObj.percentpassing = testCasePassingPercent(snapshot);
    await dbRepo.collection('tests').doc(testCase.encodedName).update(updateObj, { merge: true });
  }

  // For the Builds
  await dbRepo.collection('builds').doc(buildInfo.buildId).set({
    percentpassing: buildPassingPercent(successes, failures),
    environment: buildInfo.environment,
    timestamp: buildInfo.timestamp,
    successes: successes,
    failures: failures,
    sha: decodeURIComponent(buildInfo.sha),
    buildId: decodeURIComponent(buildInfo.buildId)
  });
}

module.exports = addBuild;
