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
  /**
  * Parse the xunit test results, converting them to an array of testrun objects.
  * Each of these testrun objects contains whether the test passed, its name, and
  * its failure message (if failed).
  * @param xmlString {string} The complete xunit string of test results sent to the endpoint
  * @returns {string[]} An array of testrun objects representing all test runs
  */
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
      const testsuiteName = suite._attributes ? this.trim(suite._attributes.name) : '';

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

        const passed = (testcase.failure === undefined && testcase.error === undefined);
        let name = testcase._attributes.name;

        if (testsuiteName.length > 0) {
          name = testsuiteName + '/' + name;
        }

        const testCaseRun = new TestCaseRun(passed, name);

        if (!testCaseRun.successful) {
          const error = testcase.error || {};
          const failure = testcase.failure || {};
          const errorMessage = error._attributes ? error._attributes.message : undefined;
          // Java puts its test logs in a CDATA element; other languages use _text.
          const failureMessage = failure._text || failure._cdata;
          testCaseRun.failureMessage = failureMessage || errorMessage;
        }

        tests.push(testCaseRun);
      }
    }
    return tests;
  }

  /**
  * The url contains 'github.com/:org/:repo', optionally followed by a path.
  * @param url {string} the Github url of where a test came from
  * @returns {string} the string following `:repo`, which may be empty
  */
  trim (url) {
    return url.replace(/^github.com\/[^/]+\/[^/]+\/?/, '');
  }
}

const parserHandler = new Parser();
module.exports = parserHandler;
