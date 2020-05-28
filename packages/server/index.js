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
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const oauth = require('simple-oauth2');
const port = process.env.PORT || 4000;
const session = require('express-session');
const pg = require('pg');
const PGSession = require('connect-pg-simple')(session);
const dbSettings = require('./database')[process.env.NODE_ENV || 'development'];
const pool = new pg.Pool(dbSettings);
const {v4} = require('uuid');
const pino = require('pino');
const logger = pino({
  level: process.env.LOG_LEVEL ? Number(process.env.LOG_LEVEL) : 'info'
});

if (!process.env.SESSION_SECRET) {
  throw new Error('set the environment variable SESSION_SECRET to a UUID');
}

const publicUrl = process.env.PUBLIC_URL || 'http://127.0.0.1:3000';

const upsertGitHubUser = require('./lib/upsert-github-user');

const sess = {
  store: new PGSession({
    pool
  }),
  secret: process.env.SESSION_SECRET,
  saveUninitialized: true,
  resave: true,
  cookie: {maxAge: 30 * 24 * 60 * 60 * 1000} // 30 days
};
if (app.get('env') === 'production') {
  sess.cookie.secure = true; // Serve secure cookies
}

const oauth2 = oauth.create({
  client: {
    id: process.env.GITHUB_CLIENT_ID,
    secret: process.env.GITHUB_CLIENT_SECRET
  },
  auth: {
    tokenHost: 'https://github.com',
    tokenPath: '/login/oauth/access_token',
    authorizePath: '/login/oauth/authorize'
  }
});
const callbackUrl = `${publicUrl}/callback/gh`;
const corsOptions = {
  origin: publicUrl,
  optionsSuccessStatus: 200, // Some legacy browsers (IE11, various SmartTVs) choke on 204
  credentials: true,
  allowedHeaders: ['Content-Type']
};

app.use(bodyParser.json({type: ['text/plain', 'application/json']}));
app.use(session(sess));

app.get('/login/github', cors(corsOptions), (request, response) => {
  const state = v4();
  request.session.state = state;
  const authorizationUrl = oauth2.authorizationCode.authorizeURL({
    redirect_uri: callbackUrl,
    scope: 'repo',
    state
  });
  response.json({
    authorization_url: authorizationUrl
  });
});

app.get('/user', cors(corsOptions), (request, response) => {
  if (request.session.user) {
    response.json(request.session.user);
  } else {
    response.status(404).json({
      msg: 'login required'
    });
  }
});

app.post('/login/github', cors(corsOptions), async (request, response) => {
  if (request.body.state === request.session.state) {
    const result = await oauth2.authorizationCode.getToken({
      code: request.body.code
    });
    const resp = oauth2.accessToken.create(result);
    if (resp.token.error) {
      response.status(400).json({
        msg: resp.token.error_description
      });
    } else {
      const client = await pool.connect();
      try {
        const user = await upsertGitHubUser(resp.token.access_token, client);
        request.session.user = user;
        response.json(user);
      } catch (error) {
        logger.error(error.stack);
        response.status(500).json({
          msg: 'unknown error'
        });
      } finally {
        client.release();
      }
    }
  } else {
    response.status(400).json({
      msg: 'invalid state, trying logging in again'
    });
  }
});

app.listen(port, () => logger.info(`listening on port ${port}`));
