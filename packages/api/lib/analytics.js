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

const NUM_STORE = 15;

class TestCaseAnalytics {
  // params: encoded name of a test and this.client.collection(global.headCollection).doc(repoid)
  constructor (testCase, cachedSuccess, cachedFails, buildInfo, prevTest) {
    this.cachedSuccess = cachedSuccess.map(x => x.toDate());
    this.cachedFails = cachedFails.map(x => x.toDate());
    this.testCase = testCase;
    this.buildInfo = buildInfo;
    this.prevTest = prevTest;
    if (testCase.successful) {
      this.addDateToList(this.cachedSuccess);
    } else {
      this.addDateToList(this.cachedFails);
    }

    this.createMergedList();

    this.deleteQueue = [];
    while (this.mergedList.length > NUM_STORE) {
      this.deleteQueue.push(this.mergedList.pop());
    }
  }

  createMergedList () {
    this.mergedList = [];
    this.cachedFails.forEach(f => {
      this.mergedList.push({
        date: f,
        passed: false
      });
    });
    this.cachedSuccess.forEach(s => {
      this.mergedList.push({
        date: s,
        passed: true
      });
    });

    this.mergedList.sort(function (a, b) {
      return b.date.getTime() - a.date.getTime(); // reversed
    });
  }

  addDateToList (listToAddTo) {
    listToAddTo.push(this.buildInfo.timestamp);
    listToAddTo.sort().reverse(); // could insert in O(n) time but not worth
  }

  computePassingPercent () {
    let numSuc = 0;
    for (let i = 0; i < this.mergedList.length; i++) {
      numSuc += this.mergedList[i].passed ? 1 : 0;
    }
    return (this.mergedList.length === 0) ? 0 : numSuc / this.mergedList.length;
  }

  numberOfHistoricalTests () {
    return (this.mergedList.length);
  }

  // function to see if we should start tracking subsequentpasses
  calculateTrack () {
    if (!this.prevTest.exists) {
      return false;
    }

    if (this.prevTest.data().shouldtrack) {
      if (this.testCase.successful) {
        // check how many subsequent passes there have been
        if (this.prevTest.data().subsequentpasses < 15) {
          return true;
        } else {
          return false;
        }
      } else {
        // the test was previously being tracked and failed, so continue tracking
        return true;
      }
    } else {
      if (this.testCase.successful) {
        // the test is successful and previously untracked, so no need to track
        return false;
      } else if (this.prevTest.data().hasfailed && this.prevTest.data().passed) {
        // the test is currently failing and has failed in a prior run, so track it
        return true;
      } else {
        // this is the first time that the test is failing, so no need to track yet
        return false;
      }
    }
  }

  incrementSubsequentPasses () {
    if (this.testCase.successful && this.prevTest.exists && this.prevTest.data().shouldtrack) {
      return 1;
    }
    // otherwise, set the subsequent passes to zero
    return 0;
  }

  isCurrentlyPassing () {
    return this.mergedList[0].passed; // should always have element
  }

  getLastUpdate () {
    return this.mergedList[0].date;
  }

  mostRecentStatus (existingStatus) {
    if ((this.mergedList.length <= 1 || this.buildInfo.timestamp > this.mergedList[1].date) && !this.testCase.successful && this.testCase.failureMessage) {
      return this.testCase.failureMessage;
    } else {
      return existingStatus;
    }
  }
}

module.exports = {
  TestCaseAnalytics: TestCaseAnalytics
};
