
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

// class to receive POSTS with build information

const firebaseEncode = require('../lib/firebase-encode');
const { InvalidParameterError, handleError } = require('../lib/errors');
const { isJson } = require('../util/validation');
const FILTERS_ALLOWED = ['tag', 'ref', 'os', 'limit', 'matrix', 'name'];

class GetTestHandler {
  constructor (app, client) {
    this.app = app;
    this.client = client;
  }

  listen () {
    // must use query parameter for the name of the test since it can be irregular (irregular strings do not work as url parameters)
    //      required query param: name
    //      optional query params: limit (# of builds), tag, matrix, os, ref
    this.app.get('/api/repo/:orgname/:reponame/test', async (req, res, next) => {
      try {
        const repoid = firebaseEncode(req.params.orgname + '/' + req.params.reponame);
        if (!req.query.name) {
          throw new InvalidParameterError('Route requires query parameter of name');
        }
        const name = firebaseEncode(req.query.name);
        let limit = 30;

        let starterQuery = this.client.collection(global.headCollection).doc(repoid)
          .collection('tests').doc(name).collection('runs');

        // add all possible where queries
        for (const prop in req.query) {
          if (!FILTERS_ALLOWED.includes(prop)) {
            throw new InvalidParameterError('Only valid params are os, ref, tag, matrix, limit, name');
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
          } else if (prop === 'name') {
            continue;
          } else {
            starterQuery = starterQuery.where('environment.' + firebaseEncode(prop), '==', req.query[prop]); // tag,
          }
        }
        const snapshot = await starterQuery.orderBy('timestamp', 'desc').limit(limit).get();
        const resp = [];
        snapshot.forEach(doc => resp.push(doc.data()));

        var metadataResp = await this.client.collection(global.headCollection).doc(repoid).collection('tests').doc(name).get();

        if (metadataResp.data()) {
          res.send({ metadata: metadataResp.data(), builds: resp });
        } else {
          res.status(404).send({ error: 'Did not find this test in this repo' });
        }
      } catch (err) {
        handleError(res, err);
      }
    });

    // returns all tests that failed or are flaky, and then any remaining tests
    this.app.get('/api/repo/:orgname/:reponame/tests', async (req, res, next) => {
      try {
        const repoid = firebaseEncode(req.params.orgname + '/' + req.params.reponame);
        let limit = 30;
        if (req.query.limit) {
          if (isNaN(req.query.limit)) {
            throw new InvalidParameterError('limit parameter must be integer');
          } else {
            limit = parseInt(req.query.limit);
          }
        }

        const failingTests = await this.client.collection(global.headCollection).doc(repoid).collection('tests')
          .orderBy('searchindex', 'desc').orderBy('lastupdate', 'desc').limit(limit).get();

        const resp = [];
        failingTests.forEach(doc => resp.push(doc.data()));
        res.send({ tests: resp });
      } catch (err) {
        handleError(res, err);
      }
    });
  }
}

module.exports = GetTestHandler;
