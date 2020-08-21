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

const xmljs = require('xml-js');
const TestCaseRun = require('../lib/testrun');

class Parser {
  parse (xmlString) {
    const obj = xmljs.xml2js(xmlString, { compact: true });
    const tests = [];
    // Python doesn't always have a top-level testsuites element.
    let testsuites = obj.testsuite;
    if (testsuites === undefined) {
      testsuites = obj.testsuites.testsuite;
    }
    if (testsuites === undefined) {
      return tests;
    }
    // If there is only one test suite, put it into an array to make it iterable.
    if (!Array.isArray(testsuites)) {
      testsuites = [testsuites];
    }
    for (const suite of testsuites) {
      // Ruby doesn't always have _attributes.
      let testsuiteName = suite._attributes ? suite._attributes.name : undefined;

      // Get rid of github.com/orgName/repoName/
      testsuiteName = this.trim(testsuiteName);

      let testcases = suite.testcase;
      // If there were no tests in the package, continue.
      if (testcases === undefined) {
        continue;
      }
      // If there is only one test case, put it into an array to make it iterable.
      if (!Array.isArray(testcases)) {
        testcases = [testcases];
      }

      for (const testcase of testcases) {
      // Ignore skipped tests. They didn't pass and they didn't fail.
        if (testcase.skipped !== undefined) {
          continue;
        }

        const failure = testcase.failure;
        const error = testcase.error;

        const okayMessage = (failure === undefined && error === undefined) ? 'ok' : 'not ok';
        let name = testcase._attributes.name;

        if (testsuiteName.length > 0) {
          name = testsuiteName + '/' + name;
        }

        const testCaseRun = new TestCaseRun(okayMessage, name);

        if (!testCaseRun.successful) {
          // Here we must have a failure or an error.
          let log = (failure === undefined) ? error._text : failure._text;
          // Java puts its test logs in a CDATA element.
          if (log === undefined) {
            log = failure._cdata;
          }

          testCaseRun.failureMessage = log;
        }

        tests.push(testCaseRun);
      }
    }
    return tests;
  }

  trim (url) {
    const updated = url.replace(/(.)*github.com\/[a-zA-Z-]*\/[a-zA-Z-]*/g, '');
    if (updated.length > 1) return updated.substring(1); // Get rid of starting `/`
    return updated;
  }

  // IMPORTANT: All values that will be used as keys in Firestore must be escaped with the firestoreEncode function
  cleanXunitBuildInfo (metadata) {
    return {};
  }
}

const parserHandler = new Parser();
module.exports = parserHandler;
