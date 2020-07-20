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

// class to receive POSTS with build information

const firebaseEncode = require('../lib/firebase-encode');
const { ResourceNotFoundError, handleError } = require('../lib/errors');
const client = require('./firestore.js');

// 1 = pass, 0 = fail, -1 = not run
class CsvRow {
  constructor (buildId, environment, timestamp, totalTestCount, testNameToId) {
    this.buildId = buildId;
    this.environment = environment;
    this.testResults = new Array(totalTestCount).fill(-1);
    this.testNameToId = testNameToId;
    this.timestamp = timestamp.toDate();
  }

  setTestResult (testName, status) {
    const testIndex = this.testNameToId[testName];
    this.testResults[testIndex] = (status === 'OK') ? 1 : 0;
  }

  toString (allMatrixList) {
    const infoAsList = [this.buildId, this.timestamp.toString(), this.environment.ref, this.environment.os, this.environment.tag];
    const parsedMatrix = this.environment.matrix;
    for (const key in allMatrixList) {
      if (key in parsedMatrix) {
        infoAsList.push(parsedMatrix[key]);
      } else {
        infoAsList.push('None');
      }
    }
    return infoAsList.concat(this.testResults).join(', ');
  }

  static getHeader (testNamesInOrder, allMatrixList) {
    return ['Build Id', 'Timestamp', 'Ref', 'Os', 'Tag'].concat(allMatrixList).concat(testNamesInOrder).join(', ');
  }
}

class GetExportHandler {
  constructor (app, client) {
    this.app = app;
    this.client = client;
  }

  async getTest (client, repoid, testname) {
    const getOperations = [];

    const allRuns = await client.collection(global.headCollection).doc(repoid).collection('tests').doc(testname).collection('runs').get();
    allRuns.forEach(run => {
      getOperations.push(run.ref.get());
    });

    return Promise.all(getOperations);
  }

  listen () {
    this.app.get('/api/repo/:orgname/:reponame/csv', async (req, res, next) => {
      try {
        const repoid = firebaseEncode(req.params.orgname + '/' + req.params.reponame);

        const getRunOperations = [];
        const testNameToId = {};
        const testNamesInOrder = [];
        let testCount = 0;

        const allTests = await this.client.collection(global.headCollection).doc(repoid).collection('tests').get();
        if (!(allTests.size > 0)) {
          throw new ResourceNotFoundError('Could not find this resource');
        }

        allTests.forEach(test => {
          getRunOperations.push(this.getTest(client, repoid, firebaseEncode(test.data().name)));

          testNameToId[test.data().name] = testCount++;
          testNamesInOrder.push(test.data().name);
        });
        const totalTestCount = testCount;

        const awaitedTests = await Promise.all(getRunOperations);

        // post process into csv
        const builds = {};
        const allMatrix = new Set();
        for (let i = 0; i < totalTestCount; i++) {
          const testname = testNamesInOrder[i];
          const test = awaitedTests[i];
          test.forEach(run => {
            const runInfo = run.data();
            if (typeof runInfo.environment.matrix === 'string') { // dont make assumptions about matrix being JSON
              try {
                runInfo.environment.matrix = JSON.parse(runInfo.environment.matrix);
              } catch (e) {
                runInfo.environment.matrix = { matrix: runInfo.environment.matrix };
              }
            }

            if (!(runInfo.buildId in builds)) {
              builds[runInfo.buildId] = new CsvRow(runInfo.buildId, runInfo.environment, runInfo.timestamp, totalTestCount, testNameToId);
              for (const key in runInfo.environment.matrix) {
                allMatrix.add(key.replace(/,/g, ''));
              }
            }
            builds[runInfo.buildId].setTestResult(testname, runInfo.status);
          });
        }

        const allMatrixList = Array.from(allMatrix);

        const stringSolution = [CsvRow.getHeader(testNamesInOrder, allMatrixList.map(x => 'Matrix.' + x))];
        for (const key in builds) {
          stringSolution.push(builds[key].toString(allMatrixList));
        }
        res.set({ 'Content-Disposition': 'attachment; filename="' + decodeURIComponent(repoid) + '.csv"' });
        res.send(stringSolution.join('\n'));
      } catch (err) {
        handleError(res, err);
      }
    });
  }
}

module.exports = GetExportHandler;
