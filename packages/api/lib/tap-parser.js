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
File with utilities for parsing Tap files and outputting them as Csv or more readable format
*/

var fs = require('fs');

// class representing single test case
class TestCaseRun {
  constructor (okMessage, number, name) {
    this.successful = (okMessage === 'ok');
    this.number = number;
    this.name = name;
    this.time = 0;
    this.timestamp = new Date();

    // additionally compute a likely but not necessarily unique substring that
    // is the part of the test after the last slash
    var n = this.name.lastIndexOf('/');
    this.shortenedName = (n >= 0) ? this.name.substring(n + 1) : this.name;
    this.encodedName = encodeURIComponent(this.name);

    this.environment = 'TODO'; // TODO
    this.buildid = 99999; // TODO
    this.failureMessage = 'TODO ERROR MESSAGE, (e.g. stackoverflow error line 13)';
  }

  display () {
    return this.number + ', ' + this.name + ', ' + this.time + ', ' + (this.successful ? '1' : '0');
  }

  setTime (time) {
    this.time = time;
    this.timestamp = new Date(time);
  }
}

// saves list of test cases to the specified file path
function saveToCsv (fileName, testCases) {
  var stringifiedTestCases = testCases.map(x => x.display());
  fs.writeFileSync(fileName, stringifiedTestCases.join('\n'));
}

// returns a list of test case objects in a raw input file
// filename just the suffix used for a unique buildid for now
function getTestCases (inputFilePath, fileName) {
  var outcome = fs.readFileSync(inputFilePath).toString().split('\n');
  const testCaseRegex = /(?<status>not ok|ok) (?<casenumb>\d+) (?<message>\S+)/;
  const dateRegex = /\d{1,2} \d{1,2}:\d\d:\d\d [A-Z]{3} \d{4}/;
  var determinedDate = null; // will be set to first found date

  var testCases = [];
  for (var i = 0; i < outcome.length; i++) {
    var tryMatch = outcome[i].match(testCaseRegex);
    var dateMatch = outcome[i].match(dateRegex);

    if (tryMatch !== null) {
      testCases.push(new TestCaseRun(tryMatch.groups.status, tryMatch.groups.casenumb, tryMatch.groups.message));
    }

    if (dateMatch !== null && determinedDate == null) {
      determinedDate = Date.parse(outcome[i]);
    }
  }

  // set all test cases to have the appropriate time

  for (i = 0; i < testCases.length; i++) {
    testCases[i].setTime(determinedDate);
    testCases[i].buildid = encodeURIComponent(fileName);
    testCases[i].environment = 'linux-' + fileName.substr(-1);
  }

  return testCases;
}

// takes input file and parses it into csv
function tapToCsv (inputFilePath, outputFilePath) {
  var testCases = getTestCases(inputFilePath);
  saveToCsv(outputFilePath, testCases);
}

module.exports = {
  tapToCsv: tapToCsv,
  getTestCases: getTestCases
};
