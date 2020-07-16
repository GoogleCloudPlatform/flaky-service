
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
const { InvalidParameterError, handleError } = require('../lib/errors');

// methods for org page
class GetOrgHandler {
  constructor (app, client) {
    this.app = app;
    this.client = client;
  }

  // ex: bar -> bas
  alphabeticallyIncrement (inputStr) {
    const strFrontCode = inputStr.slice(0, inputStr.length - 1);
    const strEndCode = inputStr.slice(inputStr.length - 1, inputStr.length);
    return strFrontCode + String.fromCharCode(strEndCode.charCodeAt(0) + 1);
  }

  paginateQuery (query, startAfter, endBefore) {
    if (startAfter) {
      query = query.startAfter(startAfter.toLowerCase());
    }
    if (endBefore) {
      query = query.endBefore(endBefore.toLowerCase());
    }
    return query;
  }

  // TODO order by flakyness
  listen () {
    // return the different environments for a build - all parameters and possible values for next query
    this.app.get('/api/repo', async (req, res, next) => {
      try {
        if (req.query.limit && isNaN(req.query.limit)) {
          throw new InvalidParameterError('limit parameter must be int');
        }
        if (!req.query.org) {
          throw new InvalidParameterError('Must include org query parameter');
        }

        const limit = parseInt(req.query.limit || 10);
        if (!req.query.startswith) { // case with no query
          let defaultQuery = this.client.collection(global.headCollection).limit(limit).orderBy('lower.name');

          defaultQuery = defaultQuery.where('lower.organization', '==', req.query.org.toLowerCase());

          defaultQuery = this.paginateQuery(defaultQuery, req.query.startaftername, req.query.endbeforename);
          const snapshot = await defaultQuery.get();
          res.send(snapshot.docs.map(doc => doc.data()));
        } else {
          // get 10 results starting with name or org/name
          const results = [];
          const startsWith = req.query.startswith.toLowerCase();

          let nameQuery = this.client.collection(global.headCollection)
            .where('lower.name', '>=', startsWith)
            .where('lower.name', '<', this.alphabeticallyIncrement(startsWith));
          nameQuery = nameQuery.where('lower.organization', '==', req.query.org.toLowerCase());

          nameQuery = nameQuery.orderBy('lower.name').limit(limit);
          nameQuery = this.paginateQuery(nameQuery, req.query.startaftername, req.query.endbeforename);
          const snapshotName = await nameQuery.get();
          snapshotName.docs.forEach(doc => {
            results.push(doc.data());
          });

          res.send(results);
        }
      } catch (err) {
        handleError(res, err);
      }
    });

    // returns all repositories for a particular org
    this.app.get('/api/org/:orgname', async (req, res, next) => {
      try {
        if (!req.params.orgname) {
          throw new InvalidParameterError('requires org parameter');
        }
        const snapshot = await this.client.collection(global.headCollection).where('lower.organization', '==', req.params.orgname.toLowerCase()).get();
        res.send(snapshot.docs.map(doc => doc.data()));
      } catch (err) {
        handleError(res, err);
      }
    });
  }
}

module.exports = GetOrgHandler;
