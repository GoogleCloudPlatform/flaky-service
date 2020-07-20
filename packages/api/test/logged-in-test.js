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

// process.env.SESSION_SECRET = 'fake-secret';
// process.env.FRONTEND_URL = 'https://flaky-dashboard.web.app/home';
// process.env.CLIENT_ID = 'fake-client-id';
// process.env.CLIENT_SECRET = 'fake-client-secret';
// const { describe, it, beforeEach, afterEach } = require('mocha');
// // const { func, server } = require('../server');
// const nock = require('nock');
// const sinon = require('sinon');

// const assert = require('assert');
// const fetch = require('node-fetch');
const assert = require('assert');
const fetch = require('node-fetch');
const isLoggedIn = require('../src/isLoggedIn.js');
const { describe, it} = require('mocha');

describe('flaky express server', () => {
  it('rejects unauthorized session', async () => {
    const resp = await fetch('http://0.0.0.0:3000/protected/api/repos');
    assert.strictEqual(resp.status, 401);
  });
});
