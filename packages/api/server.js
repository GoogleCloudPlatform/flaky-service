
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
const Repository = require('./src/repository');
const app = express();
const bodyParser = require('body-parser');

app.use(bodyParser.json());

app.get('/repos', async (req, res) => {
  // TODO: Make it return more information about the repos, beyond just their names
  const repository = new Repository(null);
  const result = await repository.getCollection('dummy-repositories');

  const repoNames = [];

  for (let index = 0; index < result.length; index++) {
    const id = result[index].repositoryid;
    repoNames.push(id);
  }

  // repoNames = ['firstRepo', 'fourthRepo', 'secondRepo', 'thirdRepo'];

  const jsonObject = { repoNames: repoNames };
  // TODO allow the requester to give search/filter criterion!
  res
    .status(200)
    .send(jsonObject)
    .end();
});

app.get('/', (req, res) => {
  const message = req.body.message ? req.body.message : 'hello world';
  res
    .status(200)
    .send(message)
    .end();
});

// GET: fetching some resource.
// POST: creating or updating a resource.
// PUT: creating or updating a resource.
app.post('/', (req, res) => {
  res.send({
    message: req.body.message ? req.body.message : 'hello world'
  });
});

const port = process.env.PORT ? Number(process.env.PORT) : 3000;
const host = '0.0.0.0';
const server = app.listen(port, host, () => console.log(`Example app listening at http://localhost:${port}`));

module.exports = server;
