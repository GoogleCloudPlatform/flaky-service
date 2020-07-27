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
const sinon = require('sinon');
const auth = require('../src/auth.js');

describe('Auth', async () => {
  describe('retrieveAccessToken', async () => {
    it('sends the correct data to Github', async () => {
      let returned;
      const stubbed = sinon.stub(auth, 'doFetch').callsFake((link, object) => {
        returned = object.body;
        return {};
      });

      await auth.retrieveAccessToken('code', 'ticketState');

      const shouldPost = JSON.stringify({
        code: 'code',
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        state: 'ticketState'
      });

      assert.deepStrictEqual(returned, shouldPost);

      stubbed.restore();
    });
  });

  describe('retrieveUserData', async () => {
    it('retrieves the user data using the correct auth token', async () => {
      let headers;
      const stubbed = sinon.stub(auth, 'doFetch').callsFake((link, object) => {
        headers = object.headers;
        return {};
      });

      await auth.retrieveUserData('accessToken');

      assert(headers.Authorization = 'token accessToken');

      stubbed.restore();
    });
  });
});
