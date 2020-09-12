
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
    // returns all repositories for a particular org
    this.app.get('/api/org/:orgname', async (req, res, next) => {
      try {
        if (!req.params.orgname) {
          throw new InvalidParameterError('requires org parameter');
        }
        const limit = parseInt(req.query.limit || 30);
        const offset = parseInt(req.query.offset || 0);

        let query = this.client.collection(global.headCollection);
        query = query.where('lower.organization', '==', req.params.orgname.toLowerCase());

        if (req.query.startswith) {
          const startsWith = req.query.startswith.toLowerCase();
          query = query.where('lower.name', '>=', startsWith)
            .where('lower.name', '<', this.alphabeticallyIncrement(startsWith));
        } else {
          if (req.query.orderby) {
            if (req.query.orderby === 'priority') {
              query = query.orderBy('searchindex', 'desc');
            }
            if (req.query.orderby === 'activity') {
              query = query.orderBy('lastupdate', 'desc');
            }
            if (req.query.orderby === 'name') {
              query = query.orderBy('lower.name');
            }
          }
        }

        query = query.offset(offset).limit(limit + 1);

        const snapshot = await query.get();
        const responseJSON = {
          hasnext: false,
          hasprev: offset > 0,
          repos: snapshot.docs.map(doc => doc.data())
        };
        for (let i = 0; i < responseJSON.repos.length; i++) {
          const rj = responseJSON.repos[i];
          if (rj.description === 'None') {
            rj.description = '';
          }
        }

        if (snapshot.size > limit) {
          responseJSON.hasnext = true;
          responseJSON.repos.pop();
        }

        res.send(responseJSON);
      } catch (err) {
        handleError(res, err);
      }
    });
  }
}

module.exports = GetOrgHandler;
