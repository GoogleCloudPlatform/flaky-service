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
const {readFileSync} = require('fs');


const parse = (xmlString) => {
	const obj = xmljs.xml2js(xmlString, {compact: true});
  const tests = [];
  // Python doesn't always have a top-level testsuites element.
  let testsuites = obj['testsuite'];
  if (testsuites === undefined) {
    testsuites = obj['testsuites']['testsuite'];
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
    const testsuiteName = suite['_attributes'] ? suite['_attributes'].name : undefined;
    let testcases = suite['testcase'];
    // If there were no tests in the package, continue.
    if (testcases === undefined) {
      continue;
    }
    // If there is only one test case, put it into an array to make it iterable.
    if (!Array.isArray(testcases)) {
      testcases = [testcases];
    }
    for (const testcase of testcases) {
      let pkg = testsuiteName;
      if (
        !testsuiteName ||
        testsuiteName === 'pytest' ||
        testsuiteName === 'Mocha Tests'
      ) {
        pkg = testcase['_attributes'].classname;
      }
      // Ignore skipped tests. They didn't pass and they didn't fail.
      if (testcase['skipped'] !== undefined) {
        continue;
      }
      const failure = testcase['failure'];
      const error = testcase['error'];
      if (failure === undefined && error === undefined) {
        tests.push({
          package: pkg,
          testCase: testcase['_attributes'].name,
          passed: true,
        });
        continue;
      }
      // Here we must have a failure or an error.
      let log = failure === undefined ? error['_text'] : failure['_text'];
      // Java puts its test logs in a CDATA element.
      if (log === undefined) {
        log = failure['_cdata'];
      }
      tests.push({
        package: pkg,
        testCase: testcase['_attributes'].name,
        passed: false,
        log,
      });
    }
  }
  return tests;
}

console.log(parse(readFileSync(require.resolve('../test/fixtures/one_failed.xml'), 'utf8')));