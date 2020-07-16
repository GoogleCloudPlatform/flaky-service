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

process.env.SESSION_SECRET = 'fake secret';
process.env.FRONTEND_URL = 'https://flaky-dashboard.web.app/home';
const { describe, it } = require('mocha');
const { func, server } = require('../server');
const chai = require('chai');
const nock = require('nock');

const assert = require('assert');
const fetch = require('node-fetch');
const mockSession = require('mock-session');
// const express = require('express');
// const app = require('../server.js');
const moment = require('moment');

nock('http://github.com')
  .post('/login/oauth/access_token')
  .reply(200, 'aaa');

nock('http://github.com')
  .filteringPath(path => '/login/oauth/authorize')
  .get('/login/oauth/authorize')
  .reply(200, {});

nock('https://flaky-dashboard.web.app')
  .get('/home')
  .reply(200, {});

describe('flaky express server', () => {
  const frontendUrl = 'https://flaky-dashboard.web.app/home';

  it('should have the mocked environment variables', () => {
    assert.strictEqual(process.env.SESSION_SECRET, 'fake secret');
    assert.strictEqual(process.env.FRONTEND_URL, frontendUrl);
  });

  // describe('/repos', async () => {
  //   it.only('returns a json object with the list of repositories, when you call GET on /repos', async () => {
  //     // let cookie = mockSession('my-session', 'my-secret', {
  //     //   'expires': moment().add(4, 'hours').format(),
  //     //   'login': 'demo-login',
  //     //   'sessionID': 'fake-id'
  //     // });

  //     // chai.request()
  //     const value = moment().add(4, 'hours');
  //     const cookie='expires=' + moment().add(4, 'hours').format() + '; login=demo-login; sessionID=fakeId' ;
  //     const resp = await fetch('http://0.0.0.0:3000/api/protected/repos', {

  //       headers: {
  //         'Content-Type': 'application/json',
  //         'session': '{cookie:' + cookie + '}',
  //         // 'cookie': 'expires=' + moment().add(4, 'hours').format() + '; login=demo-login; sessionID=fakeId'
  //       }
  //     });
  //     const sol = ['firstRepo', 'fourthRepo', 'secondRepo', 'thirdRepo'];
  //     console.log("RESPONSE: " + JSON.stringify(resp));
  //     const respJSON = await JSON.stringify(resp);;
  //     assert.deepStrictEqual(respJSON.repoNames, sol);
  //   });
  // });

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

    // it('successfully does auth process, ignoring tokens/code', async () => {
    //   nock('https://github.com')
    //   .get('/login/oauth/access_token')
    //   .reply(200, 'access_token=sample&token_type=bearer');
    // });
  });

  // describe('/api/session', async () => {
  //   it('returns 200 state when request session info', async () => {
  //     const resp = await fetch('http://0.0.0.0:3000/api/session');
  //     assert.strictEqual(resp.status, 200);
  //   });
  // });

  it('it returns a single repository, when you call GET on /repository/:id');
  it('it creates a repository, when you call POST on /repository');

  // afterEach(() => {
  //   parentServer.close();
  // })
});
