
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

// NOTE: relies on global.headCollection to be the high level repository

const addBuild = require('../src/add-build');
const TestCaseRun = require('../lib/testrun');

class PostBuildHandler {
  constructor (app, client) {
    this.app = app;
    this.client = client;
  }

  parseBuildInfo (metadata) {
    // buildInfo must have attributes of organization, timestamp, url, environment, buildId
    var returnVal = {
      repoId: encodeURIComponent(metadata.github.repository),
      organization: metadata.github.repository_owner,
      timestamp: new Date(metadata.github.event.head_commit.timestamp),
      url: metadata.github.repositoryUrl,
      environment: metadata.os.os,
      buildId: metadata.github.sha
    };

    // validate data
    for (var prop in returnVal) {
      if (!returnVal[prop]) {
        throw new Error('Missing All Build Meta Data Info - ' + prop);
      }
    }

    return returnVal;
  }

  parseTestCases (data) {
    return data.map(function (x) {
      if (typeof x.ok !== 'boolean' || !x.id || !x.name) {
        throw new Error('Missing All Test Case Info');
      }
      return new TestCaseRun(x.ok ? 'ok' : 'not ok', x.id, x.name);
    });
  }

  listen () {
    this.app.post('/postbuild', async (req, res, next) => {
      try {
        var buildInfo = this.parseBuildInfo(req.body.metadata);
        var testCases = this.parseTestCases(req.body.data);
        await addBuild(testCases, buildInfo, this.client, global.headCollection);
        res.send({ message: 'successfully added build' });
      } catch (err) {
        res.status(400).send({ error: err.message });
      }
    });
  }
}

module.exports = PostBuildHandler;
