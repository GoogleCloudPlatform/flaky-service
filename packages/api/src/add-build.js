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
const { TestCaseAnalytics } = require('../lib/analytics.js');
const { v4: uuidv4 } = require('uuid');
const awaitInBatches = require('../lib/promise-util.js');

const AGGREGATE_SIZE = 25;
const RESET_SUCCESS_COUNT = 15;
const api = { addTestRun, addBuild, updateQueue, updateTest };

/*
* Adds a list of TestCaseRun objects to the database, described by the meta information in buildInfo
*       Does not assume repository has been initializ
*       Particular build MAY NOT be added multiple times with different information, but may be added multiple times with same in
* @param buildInfo must have attributes of organization, timestamp, url, environment, buildId, buildmessage, sha, na
* @param client is the firebase client
* @param collectionName is the collection to use in firestore
*
*/
async function addBuild (testCases, buildInfo, client, collectionName) {
  const dbRepo = client.collection(collectionName).doc(buildInfo.repoId);

  // Create new Buildid this build has already been posted, skip
  buildInfo.buildIdReadable = buildInfo.buildId;
  buildInfo.buildId = uuidv4(); // buildId will always be UUID

  const [computedData] = await Promise.all([updateAllTests(testCases, buildInfo, dbRepo), isMostRecentBuild(buildInfo, dbRepo)]);

  await Promise.all([addBuildDoc(testCases, buildInfo, computedData, dbRepo), updateRepoDoc(buildInfo, dbRepo)]);
}

async function updateAllTests (testCases, buildInfo, dbRepo) {
  // For the test cases
  const metrics = {
    flaky: 0,
    failcount: 0,
    passcount: 0,
    percentpassing: 0,
    buildflaky: 0,
    total: 0
  };

  // see if this is the first build for the repository
  const isFirstBuild = await dbRepo.collection('builds').get().then(collectionSnapshot => {
    if (collectionSnapshot.size === 0) {
      return true;
    } else {
      return false;
    }
  });

  const testsToProcess = testCases.map((testCase) => {
    return () => {
      return updateQueue(isFirstBuild, testCase, buildInfo, dbRepo);
    };
  });

  const allTestMetrics = await awaitInBatches(testsToProcess, 50);

  allTestMetrics.forEach(testStatus => {
    const { passed, flaky } = testStatus;
    if (flaky) { metrics.flaky += 1; }
    if (passed) { metrics.passcount += 1; }
    if (!passed) { metrics.failcount += 1; }
    if (!passed && flaky) { metrics.buildflaky += 1; }
    metrics.total += 1;
  });

  metrics.percentpassing = (metrics.total === 0) ? 0 : metrics.passcount / metrics.total;
  return metrics;
}

async function addTestRun (testCase, buildInfo, dbRepo) {
  return dbRepo.collection('queued').doc(testCase.encodedName).collection('runs').doc(buildInfo.buildId).set(
    {
      environment: buildInfo.environment,
      status: testCase.successful ? 'OK' : testCase.failureMessage,
      timestamp: buildInfo.timestamp,
      buildId: buildInfo.buildIdReadable, // as value decoded
      buildIdInternal: buildInfo.buildId,
      sha: decodeURIComponent(buildInfo.sha)
    }
  );
}

async function updateQueue (isFirstBuild, testCase, buildInfo, dbRepo) {
  // see if the test exists in the queue
  const prevTest = await dbRepo.collection('queued').doc(testCase.encodedName).get();
  const cachedSuccess = (prevTest.exists && prevTest.data().cachedSuccess) ? prevTest.data().cachedSuccess : [];
  const cachedFails = (prevTest.exists && prevTest.data() && prevTest.data().cachedFails) ? prevTest.data().cachedFails : [];

  // We should update the queue of tests:
  // 1. if this is the very first build.
  // 2. if there have been less than a threshold of successes in a row.
  // 3. if the testCase is itself a failure.
  if (!testCase.successful || shouldContinueUpdating(prevTest) || isFirstBuild) {
    const testCaseAnalytics = new TestCaseAnalytics(testCase, cachedSuccess, cachedFails, buildInfo, prevTest);
    await api.addTestRun(testCase, buildInfo, dbRepo);
    return api.updateTest(prevTest, testCaseAnalytics, testCase, buildInfo, dbRepo);
  }
  // return metrics
  return {
    flaky: calculateFlaky(prevTest, testCase),
    passed: testCase.successful
  };
}

function shouldContinueUpdating (prevTest) {
  if (!prevTest.exists) return false;
  const test = prevTest.data();
  return test.subsequentpasses < RESET_SUCCESS_COUNT && test.hasfailed;
}

function calculateFlaky (prevTest, testCase) {
  if (prevTest.exists && prevTest.data().hasfailed) {
    // test is in the queue and has failed previously
    if (testCase.successful) {
      // currently passing
      if ((prevTest.data().subsequentpasses >= RESET_SUCCESS_COUNT) || (!prevTest.data().shouldtrack)) {
        // NOT FLAKY
        return false;
      } else {
        // FLAKY
        return true;
      }
    } else {
      // currently failing
      if (!prevTest.data().passed) {
        // not flaky, just failing multiple times in a row
        return false;
      } else {
        // FLAKY
        return true;
      }
    }
  } else {
    // test is not in the queue so NOT FLAKY
    return false;
  }
}

async function updateTest (prevTest, testCaseAnalytics, testCase, buildInfo, dbRepo) {
  const failing = !testCase.successful;
  const updateObj = {
    percentpassing: testCaseAnalytics.computePassingPercent(),
    historicaltests: testCaseAnalytics.numberOfHistoricalTests(),
    hasfailed: ((prevTest.exists && prevTest.data().hasfailed) || failing),
    shouldtrack: failing || testCaseAnalytics.calculateTrack(),
    flaky: calculateFlaky(prevTest, testCase),
    passed: testCase.successful,
    failuremessageiffailing: (!testCase.successful) ? testCase.failureMessage : 'None',
    searchindex: failing ? 2 : (calculateFlaky(prevTest, testCase) ? 1 : 0),
    lastupdate: buildInfo.timestamp,
    name: testCase.name,
    subsequentpasses: testCaseAnalytics.incrementSubsequentPasses(prevTest, testCase) === 0 ? 0 : Firestore.FieldValue.increment(1),
    lifetimepasscount: (testCase.successful) ? Firestore.FieldValue.increment(1) : Firestore.FieldValue.increment(0),
    lifetimefailcount: (testCase.successful) ? Firestore.FieldValue.increment(0) : Firestore.FieldValue.increment(1)
  };
  for (const prop in buildInfo.environment) {
    updateObj['environments.' + prop] = Firestore.FieldValue.arrayUnion(buildInfo.environment[prop]);
  }
  const firestoreTimestamp = new Firestore.Timestamp(Math.floor(buildInfo.timestamp.getTime() / 1000), 0);

  if (testCase.successful) {
    updateObj.cachedSuccess = Firestore.FieldValue.arrayUnion(firestoreTimestamp);
  } else {
    updateObj.cachedFails = Firestore.FieldValue.arrayUnion(firestoreTimestamp);
  }
  await dbRepo.collection('queued').doc(testCase.encodedName).update(updateObj, { merge: true });

  while (testCaseAnalytics.deleteQueue.length > 0) {
    const deleteMe = testCaseAnalytics.deleteQueue.pop();
    const deleteObj = {};
    const deleteDate = new Firestore.Timestamp(Math.floor(deleteMe.date.getTime() / 1000), 0);
    if (deleteMe.passed) {
      deleteObj.cachedSuccess = Firestore.FieldValue.arrayRemove(deleteDate);
    } else {
      deleteObj.cachedFails = Firestore.FieldValue.arrayRemove(deleteDate);
    }
    await dbRepo.collection('queued').doc(testCase.encodedName).update(deleteObj, { merge: true });
  }

  return {
    flaky: calculateFlaky(prevTest, testCase),
    passed: testCase.successful
  };
}

async function isMostRecentBuild (buildInfo, dbRepo) {
  const curRepo = await dbRepo.get();
  if (!curRepo.exists) {
    return true;
  }
  return buildInfo.timestamp.getTime() >= curRepo.data().lastupdate.toDate().getTime();
}

async function addBuildDoc (testCases, buildInfo, computedData, dbRepo) {
  // For the Builds
  const alltests = testCases.map(x => x.encodedName); // not currently used in MVP but would be useful for finding all tests in a build

  await dbRepo.collection('builds').doc(buildInfo.buildId).set({
    percentpassing: computedData.percentpassing,
    passcount: computedData.passcount,
    failcount: computedData.failcount,
    environment: buildInfo.environment,
    timestamp: buildInfo.timestamp,
    tests: alltests,
    sha: buildInfo.sha,
    buildId: buildInfo.buildIdReadable,
    buildIdInternal: buildInfo.buildId,
    buildmessage: buildInfo.buildmessage,
    flaky: computedData.buildflaky
  });
}

async function updateRepoDoc (buildInfo, dbRepo) {
  const repoId = decodeURIComponent(buildInfo.repoId);
  const repoUpdate = {
    organization: buildInfo.organization,
    url: buildInfo.url,
    repoId: repoId,
    name: buildInfo.name,
    description: buildInfo.description,
    lower: {
      repoId: decodeURIComponent(buildInfo.repoId).toLowerCase(),
      name: buildInfo.name.toLowerCase(),
      organization: buildInfo.organization.toLowerCase()
    }
  };
  for (const prop in buildInfo.environment) {
    repoUpdate['environments.' + prop] = Firestore.FieldValue.arrayUnion(buildInfo.environment[prop]);
  }

  // The top level repository object tracks aggregate test stats from the last
  // AGGREGATE_SIZE test runs:
  // TODO: we should consider moving towards calculating this daily to save
  // on read operations.
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

  repoUpdate.flaky = results.flaky;
  repoUpdate.numfails = results.failing;
  repoUpdate.searchindex = results.failing * 10000 + results.flaky;
  repoUpdate.numtestcases = queuedTestLookup.size;
  repoUpdate.lastupdate = buildInfo.timestamp;

  await dbRepo.update(repoUpdate, { merge: true });
}

module.exports = api;
