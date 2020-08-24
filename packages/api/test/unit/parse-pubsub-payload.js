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

const assert = require('assert');
const { describe, it } = require('mocha');
const parsePubSubPayload = require('../../lib/parse-pubsub-payload');
const pubsubPayload = require('../fixtures/pubsub-payload.json');

describe('parse-pubsub-payload', () => {
  it('parses PubSub payload, returning XML and build info', () => {
    const { xml, buildInfo } = parsePubSubPayload(pubsubPayload);
    assert.match(xml, /testsuite/);
    assert.strictEqual(buildInfo.sha, '5b586d52b1798b6edf2bec7e59402e4d4115c8ee');
    assert.strictEqual(buildInfo.repoId, 'googleapis%2Fgaxios');
    assert.strictEqual(buildInfo.organization, 'googleapis');
    assert.strictEqual(buildInfo.buildId, 'http://sponge2/38318e6f-4a1f-4650-b9ae-26d89b643c2c');
  });
});
