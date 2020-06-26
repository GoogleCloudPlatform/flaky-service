
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

class GetBuildHandler {
  constructor (app, client) {
    this.app = app;
    this.client = client;
  }

  listen () {
    // return the recent builds based on parameters
    this.app.get('/api/repo/:orgname/:reponame', async (req, res, next) => {
      try {
        const repoid = req.params.orgname + '/' + req.params.reponame;
        let limit = 100;
        let starterQuery = this.client.collection(global.headCollection).doc(firebaseEncode(repoid)).collection('builds');

        for (const prop in req.query) {
          if (prop === 'limit') {
            limit = parseInt(req.query[prop]);
          } else if (prop === 'matrix') {
            starterQuery = starterQuery.where('environment.' + prop, '==', JSON.parse(req.query[prop]));
          } else if (prop === 'repoid') {
            continue;
          } else {
            starterQuery = starterQuery.where('environment.' + prop, '==', req.query[prop]);
          }
        }
        const snapshot = await starterQuery.orderBy('timestamp', 'desc').limit(limit).get();
        const resp = [];
        snapshot.forEach(doc => resp.push(doc.data()));

        var metadata = await this.client.collection(global.headCollection).doc(firebaseEncode(repoid)).get();

        res.send({ metadata: metadata.data(), builds: resp });
      } catch (err) {
        res.status(500).send({ error: err.message, stack: err.stack, name: err.name });
      }
    });
  }
}

module.exports = GetBuildHandler;
