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

const { describe, it, before, after } = require('mocha');

const assert = require('assert');
const sinon = require('sinon');
const auth = require('../src/auth.js');

describe('Auth', async () => {
  let stubbed;
  before(() => {
    stubbed = sinon.stub(auth, 'doFetch').returns({});
  });

  after(() => {
    stubbed.restore();
  });
  describe('retrieveAccessToken', async () => {
    it('sends the correct data to Github', async () => {
      await auth.retrieveAccessToken('code', 'ticketState');

      const shouldPost = JSON.stringify({
        code: 'code',
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        state: 'ticketState'
      });
      assert(stubbed.calledWith('https://github.com/login/oauth/access_token', sinon.match.has('body', shouldPost)));
    });
  });

  describe('retrieveUserLogin', async () => {
    it('retrieves the user login using the correct auth token', async () => {
      await auth.retrieveUserLogin('accessToken');
      assert(stubbed.calledWith('https://api.github.com/user', sinon.match.has('headers', sinon.match.has('Authorization', 'token accessToken'))));
    });
  });

  describe('retrieveUserPermission', async () => {
    it('retrieves the user permission using the correct auth token', async () => {
      const stubbedSecond = sinon.stub(auth, 'retrieveUserLogin').returns('login');

      await auth.retrieveUserPermission('accessToken', 'org/repo');

      assert(stubbed.calledWith('https://api.github.com/repos/org/repo/collaborators/login/permission', sinon.match.has('headers', sinon.match.has('Authorization', 'token accessToken'))));
      assert(stubbedSecond.calledWith('accessToken'));

      stubbedSecond.restore();
    });
  });
});
