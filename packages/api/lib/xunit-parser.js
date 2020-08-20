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
      testsuiteName = testsuiteName.substring(testsuiteName.indexOf('/') + 1);
      testsuiteName = testsuiteName.substring(testsuiteName.indexOf('/') + 1);
      const index = testsuiteName.indexOf('/');
      if (index !== -1) { testsuiteName = testsuiteName.substring(index + 1); } else {
        // There is nothing past the repo url
        testsuiteName = '';
      }

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

        const testCaseRun = new TestCaseRun((failure === undefined && error === undefined) ? 'ok' : 'not ok', (testsuiteName !== '') ? testsuiteName + '/' + testcase._attributes.name : testcase._attributes.name);

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

  // IMPORTANT: All values that will be used as keys in Firestore must be escaped with the firestoreEncode function
  cleanXunitBuildInfo (metadata) {
    return {};
    //    const timestampNumb = Date.parse(metadata.timestamp);
    //    const timestamp = isNaN(timestampNumb) ? new Date() : new Date(timestampNumb);

    //    const returnVal = {
    //      repoId: firebaseEncode(decodeURIComponent(metadata.repoId)),
    //    organization: metadata.organization,
    //      timestamp,
    //      url: metadata.url,
    //      environment: PostBuildHandler.cleanEnvironment(metadata),
    //      buildId: firebaseEncode(decodeURIComponent(metadata.buildId)),
    //      sha: metadata.sha,
    //      name: metadata.name,
    //      description: metadata.description,
    //      buildmessage: metadata.buildmessage
    //    };

    //    // validate data
    //    for (const prop in returnVal) {
    //      if (!returnVal[prop]) {
    //        throw new InvalidParameterError('Missing All Build Meta Data Info - ' + prop);
    //      }
    //    }

    // /**
    // environment:
    //   matrix
    //   os
    //   ref (linking to build)
    //   tag

    // sha: should make correct, should be in Buildcop

    // */

  //    return returnVal;
  }
}

// console.log(parse(readFileSync(require.resolve('../test/fixtures/one_failed.xml'), 'utf8')));
const parserHandler = new Parser();
module.exports = parserHandler;
