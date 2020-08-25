
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

const AddBuildHandler = require('../src/add-build');
const authMiddleware = require('../lib/auth-middleware');
const cp = require('child_process');
const firebaseEncode = require('../lib/firebase-encode');
const { InvalidParameterError, UnauthorizedError, handleError } = require('../lib/errors');
const parsePubSubPayload = require('../lib/parse-pubsub-payload');
const Readable = require('stream').Readable;
const TestCaseRun = require('../lib/testrun');
const TapParser = require('tap-parser');
const { validateGithub } = require('../lib/validate-github');
const xunitParser = require('../lib/xunit-parser');

class PostBuildHandler {
  constructor (app, client) {
    this.app = app;
    this.client = client;
  }

  static parseEnvironment (metadata) {
    var envData = {
      os: metadata.os.os || 'Not specified',
      ref: metadata.github.ref || 'Not specified',
      matrix: (metadata.matrix) ? JSON.stringify(metadata.matrix, Object.keys(metadata.matrix).sort()) : 'None',
      tag: 'None'
    };
    envData.ref = envData.ref.replace('refs/', '');
    envData.ref = envData.ref.replace('heads/', '');
    // validate data
    for (const prop in envData) {
      if (!envData[prop]) {
        throw new InvalidParameterError('Missing All Build Meta Data Info - ' + prop);
      }
    }
    return envData;
  }

  // IMPORTANT: All values that will be used as keys in Firestore must be escaped with the firestoreEncode function
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
      description: metadata.github.event.repository.description || 'None',
      buildmessage: (metadata.github.workflow ? metadata.github.workflow : 'Workflow') + (metadata.github.run_number ? ' - ' + metadata.github.run_number : '')
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
      const testcase = new TestCaseRun(x.ok, x.name);

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
        var p = new TapParser();

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

  // IMPORTANT: All values that will be used as keys in Firestore must be escaped with the firestoreEncode function
  static cleanTapBuildInfo (metadata) {
    const timestampNumb = Date.parse(metadata.timestamp);
    const timestamp = isNaN(timestampNumb) ? new Date() : new Date(timestampNumb);

    const returnVal = {
      repoId: firebaseEncode(decodeURIComponent(metadata.repoId)),
      organization: metadata.organization,
      timestamp,
      url: metadata.url,
      environment: PostBuildHandler.cleanEnvironment(metadata),
      buildId: firebaseEncode(decodeURIComponent(metadata.buildId)),
      sha: metadata.sha,
      name: metadata.name,
      description: metadata.description,
      buildmessage: metadata.buildmessage
    };

    // validate data
    for (const prop in returnVal) {
      if (!returnVal[prop]) {
        throw new InvalidParameterError('Missing All Build Meta Data Info - ' + prop);
      }
    }

    return returnVal;
  }

  static cleanEnvironment (metadata) {
    var envData = {
      os: metadata.environment.os,
      ref: metadata.environment.ref,
      matrix: metadata.environment.matrix,
      tag: metadata.environment.tag
    };

    // validate data
    for (const prop in envData) {
      if (!envData[prop]) {
        throw new InvalidParameterError('Missing All Build Meta Data Info - ' + prop);
      }
    }
    return envData;
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

        if (req.body.metadata.github.event.repository.private) {
          throw new UnauthorizedError('Flaky does not store tests for private repos');
        }

        await AddBuildHandler.addBuild(PostBuildHandler.removeDuplicateTestCases(testCases), buildInfo, this.client, global.headCollection);
        res.send({ message: 'successfully added build' });
      } catch (err) {
        handleError(res, err);
      }
    });

    // endpoint expects the the required buildinfo to be in req.body.metadata to already exist and be properly formatted.
    // required keys in the req.body.metadata are the inputs for addBuild in src/add-build.js
    this.app.post('/api/build/gh/v1', async (req, res, next) => {
      try {
        if (req.body.metadata.private) {
          throw new UnauthorizedError('Flaky does not store tests for private repos');
        }

        const buildInfo = PostBuildHandler.cleanTapBuildInfo(req.body.metadata); // Different line. The metadata object is the same as addbuild, already validated

        req.body.data = await PostBuildHandler.flattenTap(req.body.data);
        const parsedRaw = await PostBuildHandler.parseRawOutput(req.body.data, req.body.type);
        const testCases = PostBuildHandler.parseTestCases(parsedRaw, req.body.data);

        const isValid = await validateGithub(req.body.metadata.token, decodeURIComponent(req.body.metadata.repoId));
        if (!isValid) {
          throw new UnauthorizedError('Must have valid Github Token to post build');
        }

        await AddBuildHandler.addBuild(PostBuildHandler.removeDuplicateTestCases(testCases), buildInfo, this.client, global.headCollection);
        res.send({ message: 'successfully added build' });
      } catch (err) {
        handleError(res, err);
      }
    });

    // endpoint expects the the required buildinfo to be in req.body.metadata to already exist and be properly formatted.
    // required keys in the req.body.metadata are the inputs for addBuild in src/add-build.js
    this.app.post('/api/build/pubsub/v1', authMiddleware, async (req, res, next) => {
      try {
        const { xml, buildInfo } = parsePubSubPayload(req.body);
        const testCases = xunitParser.parse(xml);
        await AddBuildHandler.addBuild(PostBuildHandler.removeDuplicateTestCases(testCases), buildInfo, this.client, global.headCollection);
        res.send({ message: 'successfully added build' });
      } catch (err) {
        handleError(res, err);
      }
    });
  }
}

module.exports = PostBuildHandler;
