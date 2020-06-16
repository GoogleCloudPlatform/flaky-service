
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
const addBuild = require('../src/add-build');
const TestCaseRun = require('../lib/testrun');

class PostBuildHandler {
  constructor (app, client) {
    this.app = app;
    this.client = client;
  }

  parseBuildInfo (metadata) {
    // buildInfo must have attributes of organization, timestamp, url, environment, buildId
    return {
      repoId: encodeURIComponent(metadata.github.repository),
      organization: metadata.github.repository_owner,
      timestamp: new Date(metadata.github.event.head_commit.timestamp),
      url: metadata.github.repositoryUrl,
      environment: metadata.os.os,
      buildId: metadata.github.sha
    };
  }

  parseTestCases (data) {
    return data.map(function (x) {
      return new TestCaseRun(x.ok ? 'ok' : 'not ok', x.id, x.name);
    });
  }

  listen () {
    this.app.post('/postbuild', (req, res) => {
      var buildInfo = this.parseBuildInfo(req.body.metadata);
      var testCases = this.parseTestCases(req.body.data);
      addBuild(testCases, buildInfo, this.client, 'post-build-testing');
      res.send({ message: 'goodnight moon' });
    });
  }
}

module.exports = PostBuildHandler;
