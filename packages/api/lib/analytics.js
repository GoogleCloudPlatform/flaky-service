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
  constructor (testCase, cachedSuccess, cachedFails, buildInfo) {
    this.cachedSuccess = cachedSuccess.map(x => x.toDate());
    this.cachedFails = cachedFails.map(x => x.toDate());
    this.testCase = testCase;
    this.buildInfo = buildInfo;
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

  // returns true if both...
  // condition 1: there has been a failure within the last 5 runs
  // condition 2: there have been any two failures separated by between 1 and 10 successes
  computeIsFlaky () {
    const failureIndices = [];
    for (let k = 0; k < this.mergedList.length; k++) {
      if (!this.mergedList[k].passed) {
        failureIndices.push(k);
      }
    }
    if (failureIndices.length < 2) {
      return false;
    }

    const condition1 = failureIndices[0] < 5;
    let condition2 = false;
    for (let j = 1; j < failureIndices.length; j++) {
      const dif = failureIndices[j] - failureIndices[j - 1];
      if (dif > 1 && dif <= 10) {
        condition2 = true;
      }
    }

    return condition1 && condition2;
  }

  isCurrentlyPassing () {
    return this.mergedList[0].passed; // should always have element
  }

  getLastUpdate () {
    return this.mergedList[0].date;
  }

  mostRecentStatus (existingStatus) {
    if ((this.mergedList.length <= 1 || this.buildInfo.timestamp > this.mergedList[1].date) && !this.testCase.successful) {
      return this.testCase.failureMessage;
    } else {
      return existingStatus;
    }
  }
}

module.exports = {
  TestCaseAnalytics: TestCaseAnalytics
};
