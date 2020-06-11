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

/*
@param snapshot a snapshot with the results of a firestore query
@returns a floating point number representing the percent passing in the last 100 goes, or -1 if no test cases
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

function buildPassingPercent (successes, failures) {
  var total = successes.length + Object.keys(failures).length;
  return (total > 0) ? successes.length / parseFloat(total) : -1;
}

async function addBuild (testCases, buildInfo, client, collectionName = 'repositories-fake') {
  var dbRepo = client.collection(collectionName).doc(buildInfo.repoId);

  // if repo does not exist, add information
  await dbRepo.update({
    organization: buildInfo.organization,
    url: buildInfo.url
  }, { merge: true });

  var failures = {};
  var successes = [];

  // For the test cases
  testCases.forEach(async testCase => {
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
        timestamp: buildInfo.timestamp
      }
    );

    // 2: Query an appropriate amount of test runs, for now 100 most recent
    var snapshot = await dbRepo.collection('tests').doc(testCase.encodedName).collection('runs').orderBy('timestamp').limit(100).get();

    // 3: Compute the passing percent and write that back
    await dbRepo.collection('tests').doc(testCase.encodedName).update({
      environments: Firestore.FieldValue.arrayUnion(buildInfo.environment),
      percentpassing: testCasePassingPercent(snapshot)
    }, { merge: true });
  });

  // For the Builds
  await dbRepo.collection('builds').doc(buildInfo.buildId).set({
    percentpassing: buildPassingPercent(successes, failures),
    environment: buildInfo.environment,
    timestamp: buildInfo.timestamp,
    successes: successes,
    failures: failures
  });
}

// buildInfo = {
//     repoId: encodeURIComponent("nodejs/node"),
//     buildId: "23543",
//     url: "https://github.com/nodejs/node" ,
//     environment: "linux-testing",
//     timestamp: new Date(),
// };

// testCases = [
//     new TestCaseRun("ok",1,"abort/test-abort-backtrace"),
//     new TestCaseRun("not ok",2,"abort/test-abort-uncaught-exception"),
//     new TestCaseRun("ok",3,"abort/test-addon-register-signal-handler"),
//     new TestCaseRun("not ok",4,"abort/test-addon-uv-handle-leak"),
// ]

// var client = new Firestore();
// addBuild(testCases, buildInfo, client)

module.exports = addBuild;
