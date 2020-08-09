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

const express = require('express');
const repo = require('./src/repository.js');
const app = express();
const bodyParser = require('body-parser');
const PostBuildHandler = require('./src/post-build.js');
const GetRepoHandler = require('./src/get-repo.js');
const GetOrgHandler = require('./src/get-org.js');
const GetTestHandler = require('./src/get-test.js');
const GetExportHandler = require('./src/get-export.js');
const client = require('./src/firestore.js');
const auth = require('./src/auth.js');

const { v4 } = require('uuid');

const cors = require('cors');

global.headCollection = 'production/main/repos';

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.get('/api/repo/:orgname/:reponame/test/:testid', async (req, res) => {
  const orgName = req.params.orgname;
  const repoId = req.params.reponame;
  const testName = req.params.testid;
  const redirect = req.query.redirect || process.env.FRONTEND_URL;
  const state = v4();

  await repo.storeTicket({
    action: 'delete-test',
    orgName: orgName,
    repoId: repoId,
    fullName: orgName + '/' + repoId,
    state: state,
    testName: testName,
    redirect: redirect
  });

  const url = `http://github.com/login/oauth/authorize?client_id=${process.env.CLIENT_ID}&state=${state}&allow_signup=false&scope=repo`;
  res.status(200).send(url);
});

app.get('/api/callback', async (req, res) => {
  const ticket = await repo.getTicket(req.param('state'));

  if (ticket === null) {
    return res.status(404).redirect(process.env.FRONTEND_URL);
  }

  const redirect = ticket.redirect || process.env.FRONTEND_URL;

  const storedTicketState = ticket.state;

  if (req.param('state') !== storedTicketState) {
    res.status(404).redirect(redirect);
    return;
  }

  const queryObject = await auth.retrieveAccessToken(req.param('code'), storedTicketState);

  if (queryObject === null) {
    return res.status(404).redirect(redirect);
  }
  const userPermission = await auth.retrieveUserPermission(queryObject.access_token, ticket.fullName);
  console.log('PERMISSION: ' + userPermission);

  const performed = await repo.performTicketIfAllowed(ticket, userPermission);

  if (performed) {
    console.log('Successfully performed the action');
    res.status(200).redirect(redirect + ';done=' + performed);
  } else {
    console.log('Not permitted to perform the action');
    res.status(404).redirect(redirect + ';done=' + performed);
  }
});

const postBuildHandler = new PostBuildHandler(app, client);
postBuildHandler.listen();
const getRepoHandler = new GetRepoHandler(app, client);
getRepoHandler.listen();
const getOrgHandler = new GetOrgHandler(app, client);
getOrgHandler.listen();
const getTestHandler = new GetTestHandler(app, client);
getTestHandler.listen();
const getExportHandler = new GetExportHandler(app, client);
getExportHandler.listen();

const port = process.env.PORT ? Number(process.env.PORT) : 3000;
const host = '0.0.0.0';
const server = app.listen(port, host, () => console.log(`Example app listening at http://localhost:${port}`));

module.exports = server;
