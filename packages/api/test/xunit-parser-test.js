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

describe('xunit-parser-test', () => {
  it('stores the correct number of tests', () => {
    const tests = parser(readFileSync(require.resolve('./fixtures/one_failed.xml'), 'utf8'));
    assert.strictEqual(tests.length, 4);
  });

  it('stores a passing test with the correct values', () => {
    const tests = parser(readFileSync(require.resolve('./fixtures/one_failed.xml'), 'utf8'));
    const test = tests[0];
    // <testcase classname="golang-samples" name="TestBadFiles" time="0.030"/>
    assert(test.successful === true);
    assert(test.number === 1);
    assert(test.name === 'TestBadFiles');
    assert(test.failureMessage === 'Successful');
  });
});
