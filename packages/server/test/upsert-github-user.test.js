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
//
const {beforeEach, afterEach, describe, it} = require('mocha');
const {client, before, after} = require('./utils/db-helper');
const {expect} = require('chai');
const nock = require('nock');

process.env.LOG_LEVEL = 'Infinity';
const upsertGitHubUser = require('../lib/upsert-github-user');

nock.disableNetConnect();

describe('upsertGitHubUser', () => {
  beforeEach(async () => {
    await before();
  });
  afterEach(async () => {
    await after();
  });

  it('populates a new user record first time a login is observed', async () => {
    nock('https://api.github.com')
      .get('/user')
      .reply(200, {
        login: 'bcoe',
        name: 'Ben Coe',
        email: 'bencoe@example.com',
        avatar_url: 'http://www.github.com/bencoe.png'
      });
    await upsertGitHubUser('abc123', client);
    const users = await client.query({
      text: 'SELECT login, access_token, email FROM users_github WHERE login = $1',
      values: ['bcoe']
    });
    expect(users.rowCount).to.equal(1);
    const [user] = users.rows;
    expect(user).to.eql({
      login: 'bcoe',
      access_token: 'abc123',
      email: 'bencoe@example.com'
    });
  });

  it('handles account with no email address', async () => {
    nock('https://api.github.com')
      .get('/user')
      .reply(200, {
        login: 'bcoe',
        name: 'Ben Coe',
        avatar_url: 'http://www.github.com/bencoe.png'
      });
    await upsertGitHubUser('qwerty', client);
    const users = await client.query({
      text: 'SELECT login, access_token, email FROM users_github WHERE login = $1',
      values: ['bcoe']
    });
    expect(users.rowCount).to.equal(1);
    const [user] = users.rows;
    expect(user).to.eql({
      login: 'bcoe',
      access_token: 'qwerty',
      email: null
    });
  });

  it('updates an existing user’s access token', async () => {
    nock('https://api.github.com')
      .get('/user')
      .twice()
      .reply(200, {
        login: 'bcoe',
        name: 'Ben Coe',
        email: 'bencoe@example.com',
        avatar_url: 'http://www.github.com/bencoe.png'
      });
    await upsertGitHubUser('abc123', client);
    await upsertGitHubUser('qwerty', client);
    const users = await client.query({
      text: 'SELECT login, access_token FROM users_github WHERE login = $1',
      values: ['bcoe']
    });
    expect(users.rowCount).to.equal(1);
    const [user] = users.rows;
    expect(user).to.eql({
      login: 'bcoe',
      access_token: 'qwerty'
    });
  });
});
