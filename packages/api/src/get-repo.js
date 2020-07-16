
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

// class to receive POSTS with build information

const firebaseEncode = require('../lib/firebase-encode');
const { InvalidParameterError, handleError } = require('../lib/errors');
const { isJson } = require('../util/validation');
const FILTERS_ALLOWED = ['tag', 'ref', 'os', 'limit', 'matrix'];

class GetRepoHandler {
  constructor (app, client) {
    this.app = app;
    this.client = client;
  }

  listen () {
    this.app.get('/api/repo/:orgname/:reponame', async (req, res, next) => {
      try {
        const repoid = firebaseEncode(req.params.orgname + '/' + req.params.reponame);

        const metadata = await this.client.collection(global.headCollection).doc(repoid).get();

        if (metadata.data()) {
          res.send(metadata.data());
        } else {
          res.status(404).send({ error: 'Did not find repo' });
        }
      } catch (err) {
        handleError(res, err);
      }
    });

    // return the recent builds based on parameters
    this.app.get('/api/repo/:orgname/:reponame/builds', async (req, res, next) => {
      try {
        const repoid = firebaseEncode(req.params.orgname + '/' + req.params.reponame);
        let limit = 30;
        let starterQuery = this.client.collection(global.headCollection).doc(repoid).collection('builds');

        for (const prop in req.query) {
          if (!FILTERS_ALLOWED.includes(prop)) {
            throw new InvalidParameterError('Only valid params are os, ref, tag, matrix, limit');
          }

          if (prop === 'limit') {
            if (isNaN(req.query[prop])) {
              throw new InvalidParameterError('limit parameter must be integer');
            }
            limit = parseInt(req.query[prop]);
          } else if (prop === 'matrix') {
            if (!isJson(req.query[prop])) {
              throw new InvalidParameterError('matrix parameter must be json');
            }
            starterQuery = starterQuery.where('environment.' + firebaseEncode(prop), '==', JSON.parse(req.query[prop]));
          } else {
            starterQuery = starterQuery.where('environment.' + firebaseEncode(prop), '==', req.query[prop]);
          }
        }
        const snapshot = await starterQuery.orderBy('timestamp', 'desc').limit(limit).get();
        const resp = [];
        snapshot.forEach(doc => resp.push(doc.data()));

        res.send({ builds: resp });
      } catch (err) {
        handleError(res, err);
      }
    });

    this.app.get('/api/repo/:orgname/:reponame/build/:buildid', async (req, res, next) => {
      try {
        const repoid = firebaseEncode(req.params.orgname + '/' + req.params.reponame);
        const buildid = firebaseEncode(req.params.buildid);

        const doc = await this.client.collection(global.headCollection).doc(repoid).collection('builds').doc(buildid).get();
        if (doc.data()) {
          res.send(doc.data());
        } else {
          res.status(404).send({ error: 'Build not Found' });
        }
      } catch (err) {
        handleError(res, err);
      }
    });
  }
}

module.exports = GetRepoHandler;
