
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

class GetBuildHandler {
  constructor (app, client) {
    this.app = app;
    this.client = client;
  }

  listen () {
    // return the different environments for a build - all parameters and possible values for next query
    this.app.get('/api/buildenv/:repoid', async (req, res, next) => {
      try {
        const results = await this.client.collection(global.headCollection).doc(encodeURIComponent(req.params.repoid)).get();
        res.send(results.data());
      } catch (err) {
        res.status(400).send({ error: err });
      }
    });

    // return the recent builds based on parameters
    this.app.get('/api/build/:repoid', async (req, res, next) => {
      try {
        let limit = 100;
        let starterQuery = this.client.collection(global.headCollection).doc(encodeURIComponent(req.params.repoid)).collection('builds');
        for (const prop in req.query) {
          if (prop === 'limit') {
            limit = parseInt(req.query[prop]);
          } else if (prop === 'matrix') {
            starterQuery = starterQuery.where('environment.' + prop, '==', JSON.parse(req.query[prop]));
          } else {
            starterQuery = starterQuery.where('environment.' + prop, '==', req.query[prop]);
          }
        }
        const snapshot = await starterQuery.orderBy('timestamp', 'desc').limit(limit).get();
        const resp = [];
        snapshot.forEach(doc => resp.push(doc.data()));
        res.send(resp);
      } catch (err) {
        res.status(400).send({ error: err.message, stack: err.stack, name: err.name });
      }
    });
  }
}

module.exports = GetBuildHandler;
