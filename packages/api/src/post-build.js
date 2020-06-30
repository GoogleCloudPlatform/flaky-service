
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
var Parser = require('tap-parser');
const Readable = require('stream').Readable;
const firebaseEncode = require('../lib/firebase-encode');
const { InvalidParameterError, handleError } = require('../lib/errors');

class PostBuildHandler {
  constructor (app, client) {
    this.app = app;
    this.client = client;
  }

  parseEnvironment (metadata) {
    var envData = {
      os: metadata.os.os,
      ref: metadata.github.ref,
      matrix: (metadata.matrix) ? JSON.stringify(metadata.matrix, Object.keys(metadata.matrix).sort()) : 'None',
      tag: 'None'
    };

    // validate data
    for (const prop in envData) {
      if (!envData[prop]) {
        throw new InvalidParameterError('Missing All Build Meta Data Info - ' + prop);
      }
    }
    return envData;
  }

  parseBuildInfo (metadata) {
    // buildInfo must have attributes of organization, timestamp, url, environment, buildId
    var returnVal = {
      repoId: firebaseEncode(metadata.github.repository),
      organization: metadata.github.repository_owner,
      timestamp: new Date(metadata.github.event.head_commit.timestamp),
      url: metadata.github.repositoryUrl,
      environment: this.parseEnvironment(metadata),
      buildId: firebaseEncode(metadata.github.run_id),
      sha: metadata.github.sha,
      name: metadata.github.event.repository.name
    };

    // validate data
    for (const prop in returnVal) {
      if (!returnVal[prop]) {
        throw new InvalidParameterError('Missing All Build Meta Data Info - ' + prop);
      }
    }
    if (metadata.github.run_id !== firebaseEncode(metadata.github.run_id)) {
      throw new InvalidParameterError('github.run_id must be alphanumeric');
    }

    return returnVal;
  }

  parseTestCases (data) {
    return data.map(function (x) {
      if (typeof x.ok !== 'boolean' || !x.id || !x.name) {
        throw new InvalidParameterError('Missing All Test Case Info');
      }
      return new TestCaseRun(x.ok ? 'ok' : 'not ok', x.id, x.name);
    });
  }

  async parseRawOutput (dataString, fileType) {
    switch (fileType) {
      case 'TAP': {
        var data = [];
        var p = new Parser();

        p.on('result', function (assert) {
          data.push(assert);
        });

        Readable.from(dataString).pipe(p);
        await new Promise(resolve => {
          p.on('complete', response => resolve(response));
        });

        return data;
      }
      default: {
        throw new Error('Unsupported File Type');
      }
    }
  }

  listen () {
    // route for when parsed in action
    this.app.post('/api/buildparsed', async (req, res, next) => {
      try {
        var buildInfo = this.parseBuildInfo(req.body.metadata);
        var testCases = this.parseTestCases(req.body.data);
        await addBuild(testCases, buildInfo, this.client, global.headCollection);
        res.send({ message: 'successfully added build' });
      } catch (err) {
        handleError(res, err);
      }
    });

    // route for parsing test input server side
    this.app.post('/api/build', async (req, res, next) => {
      try {
        var buildInfo = this.parseBuildInfo(req.body.metadata);
        var parsedRaw = await this.parseRawOutput(req.body.data, req.body.type);
        var testCases = this.parseTestCases(parsedRaw);
        await addBuild(testCases, buildInfo, this.client, global.headCollection);
        res.send({ message: 'successfully added build' });
      } catch (err) {
        handleError(res, err);
      }
    });
  }
}

module.exports = PostBuildHandler;
