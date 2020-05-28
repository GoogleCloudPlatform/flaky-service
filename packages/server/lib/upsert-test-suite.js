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
//
const crypto = require('crypto');
const pino = require('pino');
const logger = pino({
  level: process.env.LOG_LEVEL ? Number(process.env.LOG_LEVEL) : 'info'
});
const {noTestSuiteError, noTestCasesError} = require('./errors');
// Be mindful updating this value, as it will potentially result int
// modifying the amount of historical test-run information:
const MAX_TEST_RUNS = 100;

// There's no collision concerns, so we're opting for a
// fast algorithm when hashing the key:
function md5(string) {
  return crypto.createHash('md5').update(string).digest('hex');
}

function buildInsertStatement(repoFullName, testSuiteObject) {
  const dedupe = new Map();
  const suiteName = testSuiteObject.testsuite.$.name || '';
  logger.info(`inserting ${suiteName}`);
  const insertStrings = [];
  const values = [];
  let index = 1;
  for (const testCase of testSuiteObject.testsuite.testcase) {
    const failureMessage = testCase.failure ? testCase.failure[0] : null;
    const className = testCase.$.classname || '';
    const testName = testCase.$.name || '';
    const lastRunTime = testCase.$.time ? Number(testCase.$.time) : 0;
    const success = testCase.failure ? 0 : 1;
    const failure = testCase.failure ? 1 : 0;

    // Avoid bulk inserting two identical test entries, this happens if a suite
    // has the same class name, test name, and suite name:
    const key = `${md5(suiteName)}_${md5(className)}_${md5(testName)}`;
    if (dedupe.has(key)) {
      continue;
    }

    dedupe.set(key);

    /*
		Repo_full_name, suite, classname, name, success, failure,
		last_run_time, failing, successes, failures
		*/
    insertStrings.push(`($${index++}, $${index++}, $${index++}, $${index++},
			$${index++}, $${index++}, $${index++}, $${index++}, $${index++}, $${index++})`);
    values.push(repoFullName, suiteName, className, testName, success, failure,
      failureMessage, lastRunTime, Boolean(failure),
      [`(${success ? '"success"' : 'failure'}, "now()", ${lastRunTime})`]);
  }

  return {values, insertString: `${insertStrings.join(', ')}`};
}

module.exports = async function upsertTestSuite(repoFullName, testSuiteObject, client) {
  // Handle the case where multiple test-suites are
  // passed at once; this is the output format of tap-xunit:
  if (testSuiteObject.testsuites) {
    logger.info(`found ${testSuiteObject.testsuites.testsuite.length} test suites`);
    for (const testSuite of testSuiteObject.testsuites.testsuite) {
      await upsertTestSuite(repoFullName, {testsuite: testSuite}, client);
    }

    return;
  }

  if (!testSuiteObject.testsuite) {
    throw noTestSuiteError();
  }

  if (!testSuiteObject.testsuite || testSuiteObject.testsuite.length === 0) {
    throw noTestCasesError();
  }

  const {insertString, values} = buildInsertStatement(repoFullName, testSuiteObject);
  await client.query({
    text: `INSERT INTO  test_cases(
			repo_full_name, suite, classname, name, success, failure, failure_message,
			last_run_time, failing, runs
		)  VALUES ${insertString}
		ON CONFLICT (repo_full_name, suite, classname, name)
		DO UPDATE
			SET
				success = test_cases.success + EXCLUDED.success,
				failure = test_cases.failure + EXCLUDED.failure,
				failing = EXCLUDED.failing,
				failure_message = EXCLUDED.failure_message,
				last_run_time = EXCLUDED.last_run_time,
				runs = (EXCLUDED.runs || test_cases.runs[1:${MAX_TEST_RUNS}])
			WHERE 
				test_cases.repo_full_name = EXCLUDED.repo_full_name AND
				test_cases.suite = EXCLUDED.suite AND
				test_cases.classname = EXCLUDED.classname AND
				test_cases.name = EXCLUDED.name
		;`,
    values
  });
};
