
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
const { InvalidParameterError, UnauthorizedError, handleError } = require('../lib/errors');
const { validateGithub } = require('../lib/validate-github');
const cp = require('child_process');

class PostBuildHandler {
  constructor (app, client) {
    this.app = app;
    this.client = client;
  }

  static parseEnvironment (metadata) {
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

  static parseBuildInfo (metadata) {
    // buildInfo must have attributes of organization, timestamp, url, environment, buildId
    const timestamp = metadata.github.event.head_commit ? new Date(metadata.github.event.head_commit.timestamp) : new Date();
    const returnVal = {
      repoId: firebaseEncode(metadata.github.repository),
      organization: metadata.github.repository_owner,
      timestamp,
      url: metadata.github.repositoryUrl,
      environment: PostBuildHandler.parseEnvironment(metadata),
      buildId: firebaseEncode(metadata.github.run_id),
      sha: metadata.github.sha,
      name: metadata.github.event.repository.name,
      description: metadata.github.event.repository.description
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

  static parseTestCases (data, datastring) {
    const tapByLines = datastring.split(/\r?\n/);
    const idToLine = {};// store line number of all insertion indices
    for (let linenum = 0; linenum < tapByLines.length; linenum++) {
      const line = tapByLines[linenum];
      if (line.match(/^(not )?ok\b/)) {
        const idmatch = line.match(/\d+/);
        if (idmatch && idmatch[0]) {
          idToLine[idmatch[0]] = parseInt(linenum);
        }
      }
    }

    return data.map(function (x) {
      if (typeof x.ok !== 'boolean' || !x.id || !x.name) {
        throw new InvalidParameterError('Missing All Test Case Info');
      }
      const testcase = new TestCaseRun(x.ok ? 'ok' : 'not ok', x.id, x.name);

      // wrap failure message generation in try so still works if ids arent sequential
      try {
        // if it failed, then attempt to get the error message
        if (!x.ok) {
          const startLine = idToLine[x.id] + 1;
          const endLine = ((x.id + 1) in idToLine) ? idToLine[x.id + 1] : tapByLines.length;
          testcase.failureMessage = '';
          for (let i = startLine; i < endLine; i++) {
            if (!tapByLines[i].match(/^\s*#/)) {
              testcase.failureMessage += tapByLines[i] + '\n';
            }
          }
        }
      } catch (e) {}

      return testcase;
    });
  }

  static async parseRawOutput (dataString, fileType) {
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

  static async flattenTap (datastring) {
    const output = await new Promise(resolve => {
      var process = cp.exec('tap-parser -f -t', (error, stdout, stderr) => {
        if (error || stderr) {
          // not necessarily an error, could just mean tap was not properly formatted but still somewhat parsable
        }
        resolve(stdout);
      });

      // write your multiline variable to the child process
      process.stdin.write(datastring);
      process.stdin.end();
    });
    return output.replace(/\d+..\d+\n/, '\n'); // hacky solution to issue where 1..0 shows up at beginning
  }

  static removeDuplicateTestCases (testCases) {
    const result = [];
    const names = new Set();
    for (const tc of testCases) {
      if (!names.has(tc.name)) {
        names.add(tc.name);
        result.push(tc);
      }
    }
    return result;
  }

  listen () {
    // route for parsing test input server side
    this.app.post('/api/build', async (req, res, next) => {
      try {
        const buildInfo = PostBuildHandler.parseBuildInfo(req.body.metadata);

        req.body.data = await PostBuildHandler.flattenTap(req.body.data);
        const parsedRaw = await PostBuildHandler.parseRawOutput(req.body.data, req.body.type);
        const testCases = PostBuildHandler.parseTestCases(parsedRaw, req.body.data);

        const isValid = await validateGithub(req.body.metadata.github.token, req.body.metadata.github.repository);
        if (!isValid) {
          throw new UnauthorizedError('Must have valid Github Token to post build');
        }

        await addBuild(PostBuildHandler.removeDuplicateTestCases(testCases), buildInfo, this.client, global.headCollection);
        res.send({ message: 'successfully added build' });
      } catch (err) {
        handleError(res, err);
      }
    });
  }
}

module.exports = PostBuildHandler;
