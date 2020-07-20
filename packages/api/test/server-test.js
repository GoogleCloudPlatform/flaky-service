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

process.env.SESSION_SECRET = 'fake-secret';
process.env.FRONTEND_URL = 'https://flaky-dashboard.web.app/home';
process.env.CLIENT_ID = 'fake-client-id';
process.env.CLIENT_SECRET = 'fake-client-secret';
const { describe, it, beforeEach, afterEach } = require('mocha');
const nock = require('nock');
const sinon = require('sinon');
const url = require('url');

const assert = require('assert');
const fetch = require('node-fetch');

nock('http://github.com')
  .filteringPath(path => '/login/oauth/authorize')
  .get('/login/oauth/authorize')
  .reply(200, {});

nock('https://flaky-dashboard.web.app')
  .get('/home')
  .reply(200, {});

nock('http://github.com')
  .get('/user')
  .reply(200, {
    login: 'fake-login-valid'
  });

describe('flaky express server', () => {
  const frontendUrl = 'https://flaky-dashboard.web.app/home';

  it('should have the mocked environment variables', () => {
    assert.strictEqual(process.env.SESSION_SECRET, 'fake-secret');
    assert.strictEqual(process.env.FRONTEND_URL, frontendUrl);
  });

  describe('protected endpoints', () => {
    let auth;

    beforeEach(() => {
      // Reset the server in the cache then reimport it
      delete require.cache[require.resolve('../server.js')];
      auth = require('../src/isLoggedIn.js');

      // Stub out new behavior (always approve auth)
      sinon.stub(auth, 'isLoggedIn')
        .callsFake((req, res, next) => {
          next();
        });
    });

    afterEach(() => {
      auth.isLoggedIn.restore();
    });
    // Will work once figure out how to mock authenticated session.
    describe('/api/session', async () => {
      it('returns 200 state when request session info', async () => {
        const resp = await fetch('http://0.0.0.0:3000/protected/api/session');
        assert.strictEqual(resp.status, 200);
      });
    });

    describe('/repos', async () => {
      it('returns a json object with the list of repositories, when you call GET on /repos', async () => {
        const resp = await fetch('http://0.0.0.0:3000/protected/api/repos', {
          method: 'get',
          headers: { 'Content-Type': 'application/json' }
        });
        const sol = ['firstRepo', 'fourthRepo', 'secondRepo', 'thirdRepo'];
        const respJSON = await resp.json();
        assert.deepStrictEqual(respJSON.repoNames, sol);
      });
    });
  });

  describe('/auth', async () => {
    it('redirects to a Github url', async () => {
      const resp = await fetch('http://0.0.0.0:3000/api/auth', {
        headers: { redirect: 'manual' }
      });
      assert.strictEqual(resp.url.includes('github.com/login'), true);
    });
  });

  describe('/callback', async () => {
    it('redirects to the flaky-dev home page when the state is wrong', async () => {
      const resp = await fetch('http://0.0.0.0:3000/api/callback?state=NONSENSE', {
        headers: { redirect: 'manual' }
      });
      assert.strictEqual(resp.url, frontendUrl);
    });

    // Second major issue: test auth
    it.skip('successfully does auth process', async () => {
      const initial = await fetch('http://0.0.0.0:3000/api/auth', {
        headers: { redirect: 'manual' },
        credentials: 'include'
      });
      const queryObject = url.URL(initial.url, true).query;

      nock('http://github.com')
        .post('/login/oauth/access_token', {
          code: 'fakecode',
          client_id: process.env.CLIENT_ID,
          client_secret: process.env.CLIENT_SECRET,
          state: queryObject.state
        })
        .reply(200, 'access_token=fake-access-token');

      // const callback = await fetch('http://0.0.0.0:3000/api/callback?state=' + queryObject.state + '&code=fakecode', {
      //   headers: { redirect: 'manual' },
      //   credentials: 'include'
      // });

      // const sessionInfo = await fetch('http://0.0.0.0:3000/api/session', {
      //   headers: { 'Content-Type': 'application/json' },
      //   credentials: 'include'
      // });

      assert.strictEqual(true, false);
    });
  });

  it('it returns a single repository, when you call GET on /repository/:id');
  it('it creates a repository, when you call POST on /repository');
});
