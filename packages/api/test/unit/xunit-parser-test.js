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

const { describe, it } = require('mocha');
const assert = require('assert');
const parser = require('../../lib/xunit-parser');
const { readFileSync } = require('fs');

describe('xunit-parser-test', () => {
  it('stores the correct number of tests', () => {
    const tests = parser.parse(readFileSync(require.resolve('../fixtures/one_failed.xml'), 'utf8'));
    assert.strictEqual(tests.length, 4);
  });

  it('stores a passing test with the correct values', () => {
    const tests = parser.parse(readFileSync(require.resolve('../fixtures/one_failed.xml'), 'utf8'));
    const test = tests[0];

    assert.strictEqual(test.successful, true);
    assert.strictEqual(test.name, 'TestBadFiles');
    assert.strictEqual(test.failureMessage, 'Successful');
  });

  it('stores a failing test with the correct values', () => {
    const tests = parser.parse(readFileSync(require.resolve('../fixtures/one_failed.xml'), 'utf8'));
    const test = tests[3]; assert.strictEqual(test.successful, false);
    assert.strictEqual(test.name, 'spanner/spanner_snippets/TestSample');
    assert.strictEqual(test.failureMessage, '\nsnippet_test.go:242: got output ""; want it to contain "4 Venue 4" snippet_test.go:243: got output ""; want it to contain "19 Venue 19" snippet_test.go:244: got output ""; want it to contain "42 Venue 42"\n');
  });

  it('handles an empty testsuite', () => {
    const tests = parser.parse(readFileSync(require.resolve('../fixtures/empty_results.xml'), 'utf8'));
    assert.deepStrictEqual(tests, []);
  });

  it('ignores skipped tests', () => {
    const tests = parser.parse(readFileSync(require.resolve('../fixtures/go_skip.xml'), 'utf8'));
    assert.strictEqual(tests.length, 1);
  });
});
