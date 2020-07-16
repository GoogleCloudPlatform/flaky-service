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

class TestCaseAnalytics {
  // params: encoded name of a test and this.client.collection(global.headCollection).doc(repoid)
  constructor (testCase, snapshot) {
    this.testCase = testCase;
    this.snapshot = snapshot;
    this.snapshotData = [];
    this.snapshot.forEach((doc) => this.snapshotData.push(doc.data()));
  }

  computePassingPercent () {
    let successCnt = 0;
    let total = 0;
    this.snapshotData.forEach((doc) => {
      successCnt += doc.status === 'OK' ? 1 : 0;
      total += 1;
    });
    return (total > 0) ? successCnt / parseFloat(total) : -1;
  }

  // returns true if both...
  // condition 1: there has been a failure within the last 5 runs
  // condition 2: there have been any two failures separated by between 1 and 10 successes
  computeIsFlaky () {
    const failureIndices = [];
    for (let k = 0; k < this.snapshotData.length; k++) {
      if (this.snapshotData[k].status !== 'OK') {
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
    return this.snapshotData[0].status === 'OK';
  }

  getLastUpdate () {
    return this.snapshotData[0].timestamp;
  }
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

module.exports = {
  buildPassingPercent: buildPassingPercent,
  TestCaseAnalytics: TestCaseAnalytics
};
