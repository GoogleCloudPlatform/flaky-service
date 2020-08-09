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

process.env.FRONTEND_URL = 'https://flaky-dashboard.web.app/home';
process.env.CLIENT_ID = 'client-id-for-testing';
const { describe, it, afterEach } = require('mocha');

const assert = require('assert');
const fetch = require('node-fetch');
const sinon = require('sinon');
const querystring = require('querystring');
const auth = require('../src/auth.js');
const repo = require('../src/repository.js');

describe('flaky express server', () => {
  let stubs = [];
  const frontendUrl = 'https://flaky-dashboard.web.app/home';

  afterEach(() => {
    /** Cleanup **/
    stubs.forEach(stubbed => {
      stubbed.restore();
    });
    stubs = [];
  });

  it('should have the mocked environment variables', () => {
    assert.strictEqual(process.env.FRONTEND_URL, frontendUrl);
  });

  describe('delete /repo', async () => {
    it('generates a GitHub redirect', async () => {
      stubs.push(sinon.stub(repo, 'storeTicket').returns(true));
      const resp = await fetch('http://0.0.0.0:3000/api/repo/my-org/my-repo/test/my-test?redirect=' + process.env.FRONTEND_URL, {
        method: 'GET'
      });
      const respJSON = await resp.text();
      assert(respJSON.includes('github.com/login/oauth'));
    });

    it('stores correct information in the ticket', async () => {
      const stubbed = sinon.stub(repo, 'storeTicket');
      stubs.push(stubbed);

      await fetch('http://0.0.0.0:3000/api/repo/my-org/my-repo/test/my-test?redirect=' + process.env.FRONTEND_URL, {
        method: 'GET'
      });

      assert(stubbed.calledWithMatch({
        action: 'delete-test',
        orgName: 'my-org',
        repoId: 'my-repo',
        testName: 'my-test',
        redirect: process.env.FRONTEND_URL
      }));
    });
  });

  describe('/callback', async () => {
    it('completes the authentication dance', async () => {
      /** Stubbing **/
      const queryObject = querystring.stringify({ access_token: 'fake-access-token' });

      stubs.push(sinon.stub(auth, 'retrieveAccessToken').returns(queryObject));

      stubs.push(sinon.stub(auth, 'retrieveUserPermission').returns('write'));

      stubs.push(sinon.stub(repo, 'performTicketIfAllowed').returns(true));

      const fakeState = 'testing-state';
      stubs.push(sinon.stub(repo, 'getTicket').returns({
        state: fakeState,
        redirect: process.env.FRONTEND_URL
      }));

      /** Testing **/
      const resp = await fetch('http://0.0.0.0:3000/api/callback?state=' + fakeState + '&code=ANYTHING', {
        headers: { redirect: 'manual' }
      });
      assert.strictEqual(resp.url, process.env.FRONTEND_URL + ';done=true');
      assert.strictEqual(resp.status, 200);
    });

    it('redirects to the flaky-dev home page when the state is wrong', async () => {
      const resp = await fetch('http://0.0.0.0:3000/api/callback?state=NONSENSE', {
        headers: { redirect: 'manual' }
      });
      assert.strictEqual(resp.url, frontendUrl);
    });
  });

  it('it returns a single repository, when you call GET on /repository/:id');
  it('it creates a repository, when you call POST on /repository');
});
