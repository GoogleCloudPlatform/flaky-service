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
const parser = require('../lib/xunit-parser');
const { readFileSync } = require('fs');

describe.only('xunit-parser-test', () => {
  it('stores the correct number of tests', () => {
    const tests = parser(readFileSync(require.resolve('./fixtures/one_failed.xml'), 'utf8'));
    assert.strictEqual(tests.length, 4);
  });

  it('stores a passing test with the correct values', () => {
    const tests = parser(readFileSync(require.resolve('./fixtures/one_failed.xml'), 'utf8'));
    const test = tests[0];

    assert(test.successful === true);
    assert(test.number === 1);
    assert(test.name === 'TestBadFiles');
    assert(test.failureMessage === 'Successful');
  });

  it('stores a failing test with the correct values', () => {
  	const tests = parser(readFileSync(require.resolve('./fixtures/one_failed.xml'), 'utf8'));
  	const test = tests[3];

    assert.strictEqual(test.successful, false);
    assert.strictEqual(test.number, 4);
    assert.strictEqual(test.name, 'spanner/spanner_snippets/TestSample');
    assert.strictEqual(test.failureMessage, '\nsnippet_test.go:242: got output ""; want it to contain "4 Venue 4" snippet_test.go:243: got output ""; want it to contain "19 Venue 19" snippet_test.go:244: got output ""; want it to contain "42 Venue 42"\n');
  });

  it('finds one failure', () => {
  	const tests = parser(readFileSync(require.resolve('./fixtures/one_failed.xml'), 'utf8'));
  	expect(results).to.eql({
      failures: [
        {
          package:
              'github.com/GoogleCloudPlatform/golang-samples/spanner/spanner_snippets',
          testCase: 'TestSample',
          passed: false,
          log:
              '\nsnippet_test.go:242: got output ""; want it to contain "4 Venue 4" snippet_test.go:243: got output ""; want it to contain "19 Venue 19" snippet_test.go:244: got output ""; want it to contain "42 Venue 42"\n'
        }
      ],
      passes: [
        {
          package: 'github.com/GoogleCloudPlatform/golang-samples',
          testCase: 'TestBadFiles',
          passed: true
        },
        {
          package: 'github.com/GoogleCloudPlatform/golang-samples',
          testCase: 'TestLicense',
          passed: true
        },
        {
          package: 'github.com/GoogleCloudPlatform/golang-samples',
          testCase: 'TestRegionTags',
          passed: true
        }
      ]
    });
  });

  it('finds many failures in one package', () => {
    	const tests = parser(readFileSync(require.resolve('./fixtures/many_failed_same_pkg.xml'), 'utf8'));
    expect(results).to.eql({
      failures: [
        {
          package:
              'github.com/GoogleCloudPlatform/golang-samples/storage/buckets',
          testCase: 'TestBucketLock',
          passed: false,
          log:
              'main_test.go:234: failed to create bucket ("golang-samples-tests-8-storage-buckets-tests"): Post https://storage.googleapis.com/storage/v1/b?alt=json&prettyPrint=false&project=golang-samples-tests-8: read tcp 10.142.0.112:33618->108.177.12.128:443: read: connection reset by peer'
        },
        {
          package:
              'github.com/GoogleCloudPlatform/golang-samples/storage/buckets',
          testCase: 'TestUniformBucketLevelAccess',
          passed: false,
          log:
              'main_test.go:242: failed to enable uniform bucket-level access ("golang-samples-tests-8-storage-buckets-tests"): googleapi: Error 404: Not Found, notFound'
        }
      ],
      passes: [
        {
          package: 'github.com/GoogleCloudPlatform/golang-samples',
          testCase: 'TestBadFiles',
          passed: true
        },
        {
          package:
              'github.com/GoogleCloudPlatform/golang-samples/storage/buckets',
          testCase: 'TestCreate',
          passed: true
        },
        {
          package:
              'github.com/GoogleCloudPlatform/golang-samples/storage/gcsupload',
          testCase: 'TestUpload',
          passed: true
        }
      ]
    });
  });

  it('finds no failures in a successful log', () => {
  	const tests = parser(readFileSync(require.resolve('./fixtures/passed.xml'), 'utf8'));
    const results = findTestResults(input);
    expect(results).to.eql({
      failures: [],
      passes: [
        {
          package: 'github.com/GoogleCloudPlatform/golang-samples',
          testCase: 'TestBadFiles',
          passed: true
        },
        {
          package:
              'github.com/GoogleCloudPlatform/golang-samples/appengine/go11x/helloworld',
          testCase: 'TestIndexHandler',
          passed: true
        }
      ]
    });
  });

  it('handles an empty testsuites', () => {
  	const tests = parser(readFileSync(require.resolve('./fixtures/empty_results.xml'), 'utf8'));
    expect(results).to.eql({
      passes: [],
      failures: []
    });
  });

  it('ignores skipped tests', () => {
  	const tests = parser(readFileSync(require.resolve('./fixtures/go_skip.xml'), 'utf8'));
    const results = findTestResults(input);
    expect(results).to.eql({
      failures: [],
      passes: [
        {
          package: 'github.com/GoogleCloudPlatform/golang-samples',
          testCase: 'TestLicense',
          passed: true
        }
      ]
    });
  });
});
