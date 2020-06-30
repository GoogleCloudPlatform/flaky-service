
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

class GetRepoOrgsHandler {
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

  removeDuplicates (results) {
    const usedIds = new Set();
    const newResults = [];
    results.forEach(result => {
      if (!usedIds.has(result.repoId)) {
        usedIds.add(result.repoId);
        newResults.push(result);
      }
    });
    return newResults;
  }

  // TODO order by flakyness
  listen () {
    // return the different environments for a build - all parameters and possible values for next query
    this.app.get('/api/repo', async (req, res, next) => {
      try {
        if (req.query.limit && isNaN(req.query.limit)) {
          throw new InvalidParameterError('limit parameter must be int');
        }
        const limit = parseInt(req.query.limit || 10);
        if (!req.query.startswith) { // case with no query
          const snapshot = await this.client.collection(global.headCollection).limit(limit).get();
          res.send(snapshot.docs.map(doc => doc.data()));
        } else {
          // get 10 results starting with name or org/name
          const results = [];
          const startsWith = req.query.startswith.toLowerCase();

          const snapshotName = await this.client.collection(global.headCollection)
            .where('lower.name', '>=', startsWith)
            .where('lower.name', '<', this.alphabeticallyIncrement(startsWith))
            .limit(limit).get();
          snapshotName.docs.forEach(doc => results.push(doc.data()));

          const snapshotOrg = await this.client.collection(global.headCollection)
            .where('lower.repoId', '>=', startsWith)
            .where('lower.repoId', '<', this.alphabeticallyIncrement(startsWith))
            .limit(limit).get();
          snapshotOrg.docs.forEach(doc => results.push(doc.data()));

          res.send(this.removeDuplicates(results));
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

module.exports = GetRepoOrgsHandler;
