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

const fetch = require('node-fetch');
const querystring = require('querystring');

class Auth {
  async retrieveAccessToken (code, storedTicketState) {
    const resp = await this.doFetch('https://github.com/login/oauth/access_token', {
      method: 'post',
      body: JSON.stringify({
        code: code,
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        state: storedTicketState
      }),
      headers: { 'Content-Type': 'application/json' }
    });

    if (resp.status !== 200) {
      return null;
    }

    const respText = await resp.text();
    return querystring.parse(respText);
  }

  async retrieveUserData (accessToken) {
    const result = await this.doFetch('https://api.github.com/user', {
      method: 'get',
      headers: { 'content-type': 'application/json', 'User-Agent': 'flaky.dev', Authorization: 'token ' + accessToken }
    });

    if (result.status !== 200) {
      return null;
    }
    const resJSON = await result.json();
    return resJSON;
  }

  async doFetch (link, object) {
    const result = await fetch(link, object);
    return result;
  }
}

const AuthHandler = new Auth();
module.exports = AuthHandler;
