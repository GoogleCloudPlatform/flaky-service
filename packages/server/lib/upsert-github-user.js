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
const {Octokit} = require('@octokit/rest');
const pino = require('pino');
const logger = pino({
  level: process.env.LOG_LEVEL ? Number(process.env.LOG_LEVEL) : 'info'
});

module.exports = async (accessToken, client) => {
  const octokit = new Octokit({
    auth: accessToken
  });
  const user = (await octokit.users.getAuthenticated()).data;
  const existingUser = await client.query({
    text: 'SELECT login FROM users_github WHERE login = $1',
    values: [user.login]
  });
  if (existingUser.rowCount === 0) {
    logger.info(`user ${user.login} is new, creating entry`);
    await client.query({
      text: 'INSERT INTO users_github(login, email, name, avatar_url, access_token) VALUES ($1, $2, $3, $4, $5)',
      values: [user.login, user.email, user.name, user.avatar_url, accessToken]
    });
  } else {
    logger.info(`user ${user.login} already exists, updating token`);
    await client.query({
      text: 'UPDATE users_github SET access_token = $1 WHERE login = $2',
      values: [accessToken, user.login]
    });
  }

  return {
    login: user.login,
    name: user.name,
    email: user.email,
    avatar_url: user.avatar_url
  };
};
