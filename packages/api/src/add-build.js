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
// Main Functionalitkk
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

  const phaseOne = await Promise.all([updateAllTests(testCases, buildInfo, dbRepo), isMostRecentBuild(buildInfo, dbRepo)]);
  // unpack results
  const computedData = phaseOne[0];
  const mostRecent = phaseOne[1];

  await Promise.all([addBuildDoc(testCases, buildInfo, computedData, dbRepo), updateRepoDoc(buildInfo, computedData, mostRecent, dbRepo)]);
}

async function updateAllTests (testCases, buildInfo, dbRepo) {
  // For the test cases
  const metrics = {
    flaky: 0,
    failcount: 0,
    passcount: 0,
    //percentpassing: 0,
    buildflaky: 0,
    total: 0
  };

  //see if this is the first build for the repository
  const isFirstBuild = await dbRepo.collection('builds').get().then(collectionSnapshot => {
    if(collectionSnapshot.size == 0){
      return true;
    }
    else{
      return false;
    }
  });

  const testsToProcess = testCases.map((testCase) => {
    return () => {
      return Promise.resolve(updateQueue(isFirstBuild, testCase, buildInfo, dbRepo));
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

  //metrics.percentpassing = (metrics.total === 0) ? 0 : metrics.passcount / metrics.total;
  console.log(metrics);
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
  //see if the test exists in the queue
  const prevTest = await dbRepo.collection('queued').doc(testCase.encodedName).get();
  const cachedSuccess = (prevTest.exists && prevTest.data().cachedSuccess) ? prevTest.data().cachedSuccess : [];
  const cachedFails = (prevTest.exists && prevTest.data() && prevTest.data().cachedFails) ? prevTest.data().cachedFails : [];

  const testCaseAnalytics = new TestCaseAnalytics(testCase, cachedSuccess, cachedFails, buildInfo);

  if(isFirstBuild) {
    await addTestRun(testCase, buildInfo, dbRepo);
    return Promise.resolve(updateTest(isFirstBuild, prevTest, testCaseAnalytics, testCase, buildInfo, dbRepo));
  }

  //check the status of the current test run
  if(!testCase.successful) {
    //the current run fails
    //whether this run's test is in the queue or not, call updateTest
    //to add the test to the queue, or update it appropriately
    await addTestRun(testCase, buildInfo, dbRepo);
    return Promise.resolve(updateTest(isFirstBuild, prevTest, testCaseAnalytics, testCase, buildInfo, dbRepo));
  }
  else{
    //the current run is successful
    if(calculateFlaky(prevTest, testCase)) {
      //the current run is flaky so it must be updated
      await addTestRun(testCase, buildInfo, dbRepo);
      return Promise.resolve(updateTest(isFirstBuild, prevTest, testCaseAnalytics, testCase, buildInfo, dbRepo));
    }
    else if(prevTest.exists) {
      if(prevTest.data().passed) {
        //remove the test from the queue, it was previously passing and is currently passing
        await dbRepo.collection('queued').doc(testCase.encodedName).delete();
      }
      else {
        //the current run is successful and not flaky but previously failed, update the test to be passing
        await addTestRun(testCase, buildInfo, dbRepo);
        return Promise.resolve(updateTest(isFirstBuild, prevTest, testCaseAnalytics, testCase, buildInfo, dbRepo));
      }
    }
    //if the test does not previously exist in the queue, do nothing
  }
  //return metrics
  return {
    flaky: calculateFlaky(prevTest, testCase),
    passed: testCase.successful
  };
}

async function updateTest (isFirstBuild, prevTest, testCaseAnalytics, testCase, buildInfo, dbRepo) {
  const updateObj = {
    //percentpassing: testCaseAnalytics.computePassingPercent(),
    hasfailed: ((prevTest.exists && prevTest.data().hasfailed) || !testCase.successful),
    shouldtrack: calculateTrack(prevTest, testCase),
    flaky: calculateFlaky(prevTest, testCase),
    passed: testCase.successful,
    failuremessageiffailing: testCaseAnalytics.mostRecentStatus(prevTest.exists ? prevTest.data().failuremessageiffailing : 'None'),
    searchindex: testCaseAnalytics.isCurrentlyPassing() ? (testCaseAnalytics.computeIsFlaky() ? 1 : 0) : 2,
    lastupdate: testCaseAnalytics.getLastUpdate(),
    name: testCase.name,
    subsequentpasses: calculateSubsequentPasses(prevTest, testCase),
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

//function to see if we should start tracking subsequentpasses
function calculateTrack (prevTest, testCase) {
  if(!prevTest.exists) {
    return false;
  }

  if(prevTest.data().shouldtrack){
    if(testCase.successful){
      //check how many subsequent passes there have been
      if(prevTest.data().subsequentpasses < 15) {
        return true;
      }
      else{
        return false;
      }
    }
    else{
      //the test was previously being tracked and failed, so continue tracking
      return true;
    }
  }
  else {
    if(testCase.successful) {
      //the test is successful and previously untracked, so no need to track
      return false;
    }
    else if(prevTest.data().hasfailed && prevTest.data().passed) {
      //the test is currently failing and has failed in a prior run, so track it
      return true;
    }
    else{
      //this is the first time that the test is failing, so no need to track yet
      return false;
    }
  }
}

function calculateFlaky (prevTest, testCase) {
  if(prevTest.exists && prevTest.data().hasfailed){
    //test is in the queue and has failed previously
    if(testCase.successful){
      //currently passing
      if((prevTest.data().subsequentpasses >= 15)||(!prevTest.data().shouldtrack)){
        //NOT FLAKY
        return false;
      }
      else{
        //FLAKY
        return true;
      }
    }
    else{
      //currently failing
      if(prevTest.data().subsequentpasses == 0) {
        //NOT FLAKY, just failing
        return false;
      }
      else{
        //FLAKY
        return true;
      }
    }

  }
  else{
    //test is not in the queue so NOT FLAKY
    return false;
  }
}


function calculateSubsequentPasses (prevTest, testCase) {
  if(testCase.successful) {
    //currently passing
    if(prevTest.exists && prevTest.data().shouldtrack) {
      //test was previously in the queue
      return (prevTest.data().subsequentpasses+1);
    }
  }

  //otherwise, set the subsequent passes to zero
  return 0;
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
    //percentpassing: computedData.percentpassing,
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

async function updateRepoDoc (buildInfo, computedData, mostRecent, dbRepo) {
  const repoUpdate = {
    organization: buildInfo.organization,
    url: buildInfo.url,
    repoId: decodeURIComponent(buildInfo.repoId),
    name: buildInfo.name,
    description: buildInfo.description,
    lower: {
      repoId: decodeURIComponent(buildInfo.repoId).toLowerCase(),
      name: buildInfo.name.toLowerCase(),
      organization: buildInfo.organization.toLowerCase()
    },
    flaky: computedData.flaky
  };
  for (const prop in buildInfo.environment) {
    repoUpdate['environments.' + prop] = Firestore.FieldValue.arrayUnion(buildInfo.environment[prop]);
  }

  if (mostRecent) {
    repoUpdate.numfails = computedData.failcount;
    repoUpdate.searchindex = computedData.failcount * 10000 + computedData.flaky;
    repoUpdate.numtestcases = computedData.total;
    repoUpdate.lastupdate = buildInfo.timestamp;
  }

  await dbRepo.update(repoUpdate, { merge: true });
  // note: in extremely rare circumstances this results in incorrect ordering -
  // when a build is added non chronologically that makes multiple tests flaky, and two repos have the same number of
  // failing test cases in most recent build, then their secondary ordering based on flakiness would be wrong, but it is not worth the extra
  // db read operation to fix this. This would only be visible when ordering by priority on org page.
}

module.exports = addBuild;
