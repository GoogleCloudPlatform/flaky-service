
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
// limitations under the License.

const EXAMPLE_PAYLOAD = require('./res/post-payload.json');

const fs = require('fs');
var path = require('path');
const EXAMPLE_TAP_ERRORS = fs.readFileSync(path.join(__dirname, 'res/sampletap.tap'), 'utf8');
const EXAMPLE_TAP_MANGLED = fs.readFileSync(path.join(__dirname, 'res/mangledtap.tap'), 'utf8');
const EXAMPLE_TAP_NESTED = fs.readFileSync(path.join(__dirname, 'res/nestedtap.tap'), 'utf8');
const EXAMPLE_STUFF_ON_TOP = fs.readFileSync(path.join(__dirname, 'res/stuffontoptap.tap'), 'utf8');

const { describe, before, after, it, afterEach } = require('mocha');
const { v4: uuidv4 } = require('uuid');
const firebaseEncode = require('../lib/firebase-encode');

const nock = require('nock');
const sinon = require('sinon');
const validNockResponse = require('./res/sample-validate-resp.json');
const { deleteRepo } = require('../lib/deleter');

const PostBuildHandler = require('../src/post-build.js');
const AddBuildHandler = require('../src/add-build');
const client = require('../src/firestore.js');

const assert = require('assert');
const fetch = require('node-fetch');

const xunitParser = require('../lib/xunit-parser');

nock.disableNetConnect();
nock.enableNetConnect(/^(?!.*github\.com).*$/); // only disable requests on github.com

describe('Posting Builds', () => {
  before(async () => {
    global.headCollection = 'testing/' + 'postingbuild-test-' + uuidv4() + '/repos';

    nock('https://api.github.com', {
      reqheaders: {
        Authorization: 'token WRONGTOKEN'
      }
    }).persist()
      .get('/installation/repositories')
      .reply(401, {
        message: 'Bad credentials',
        documentation_url: 'https://developer.github.com/v3'
      });

    nock('https://api.github.com', {
      reqheaders: {
        Authorization: 'token CORRECTTOKEN'
      }
    }).persist()
      .get('/installation/repositories')
      .reply(200, validNockResponse);
  });

  it('should be able to parse a TAP file with errors and extract error messages', async () => {
    const parsedRaw = await PostBuildHandler.parseRawOutput(EXAMPLE_TAP_ERRORS, 'TAP');
    const testcases = PostBuildHandler.parseTestCases(parsedRaw, EXAMPLE_TAP_ERRORS);

    assert(testcases[0].successful);
    assert(testcases[0].failureMessage.includes('Successful'));

    // two failed
    assert(!testcases[2].successful);
    assert(testcases[2].failureMessage.includes('AssertionError'));

    // five failed
    assert(!testcases[5].successful);
    assert(testcases[5].failureMessage.includes('AssertionError'));
  });

  it('should parse a mangled TAP file without breaking ', async () => {
    const parsedRaw = await PostBuildHandler.parseRawOutput(EXAMPLE_TAP_MANGLED, 'TAP');
    const testcases = PostBuildHandler.parseTestCases(parsedRaw, EXAMPLE_TAP_MANGLED);

    assert.strictEqual(testcases.length, 6);
    const sols = [true, true, false, true, true, false];
    for (let i = 0; i < testcases.length; i++) {
      assert.strictEqual(testcases[i].successful, sols[i]);
    }
    // failure messages will be mangled which is inevitable when taking this approach
    // but good that core functionality still works
  });

  it('should handle a test with a not flat structure and repeated tests', async () => {
    const flattenedLog = await PostBuildHandler.flattenTap(EXAMPLE_TAP_NESTED);
    const parsedRaw = await PostBuildHandler.parseRawOutput(flattenedLog, 'TAP');
    const testcases = PostBuildHandler.parseTestCases(parsedRaw, flattenedLog);

    assert.strictEqual(testcases.length, 6);

    assert.strictEqual(PostBuildHandler.removeDuplicateTestCases(testcases).length, 4);
  });

  it('should handle a test with other stuff at the top', async () => {
    const flattenedLog = await PostBuildHandler.flattenTap(EXAMPLE_STUFF_ON_TOP);
    const parsedRaw = await PostBuildHandler.parseRawOutput(flattenedLog, 'TAP');
    const testcases = PostBuildHandler.parseTestCases(parsedRaw, flattenedLog);

    assert.strictEqual(testcases.length, 3);
  });

  it('should send back an error code when being sent invalid metadata', async () => {
    const botchedPayload = JSON.parse(JSON.stringify(EXAMPLE_PAYLOAD));
    delete botchedPayload.metadata.repoId;

    const resp = await fetch('http://127.0.0.1:3000/api/build/gh/v1', {
      method: 'post',
      body: JSON.stringify(botchedPayload),
      headers: { 'Content-Type': 'application/json' }
    });
    assert.strictEqual(resp.status, 400);
  });

  it('should send back an error code if token is incorrect', async () => {
    const botchedPayload = JSON.parse(JSON.stringify(EXAMPLE_PAYLOAD));
    botchedPayload.metadata.token = 'WRONGTOKEN';

    const resp = await fetch('http://127.0.0.1:3000/api/build/gh/v1', {
      method: 'post',
      body: JSON.stringify(botchedPayload),
      headers: { 'Content-Type': 'application/json' }
    });

    assert.strictEqual(resp.status, 401);
  });

  it('it should be able to post data already formatted to /build/gh/v1', async () => {
    const payloadJSON = JSON.parse(JSON.stringify(EXAMPLE_PAYLOAD));

    payloadJSON.metadata = {
      repoId: 'nodejs/node', // This value needs to be encoded
      organization: 'nodejs',
      name: 'node',
      buildId: '11111',
      sha: '123',
      url: 'https://github.com/nodejs/WRONG', // URL starts off wrong
      environment: {
        os: 'linux-apple',
        matrix: { 'node-version': '12.0' },
        ref: 'master',
        tag: 'abc'
      },
      timestamp: 'foobar', // invalid date that will be replaced
      description: 'nodejs repository',
      buildmessage: 'Workflow - 1',
      token: 'CORRECTTOKEN',
      private: false
    };

    nock('https://api.github.com', {
      reqheaders: {
        Authorization: 'token CORRECTTOKEN'
      }
    }).persist()
      .get('/installation/repositories')
      .reply(200, validNockResponse);

    const resp = await fetch('http://127.0.0.1:3000/api/build/gh/v1', {
      method: 'post',
      body: JSON.stringify(payloadJSON),
      headers: { 'Content-Type': 'application/json' }
    });
    const respJSON = await resp.json();
    assert.strictEqual(respJSON.message, 'successfully added build');

    var repoId = firebaseEncode(payloadJSON.metadata.repoId);
    var buildId = payloadJSON.metadata.buildId;

    var repositoryInfo = await client.collection(global.headCollection).doc(repoId).get();
    assert.strictEqual(repositoryInfo.data().organization, payloadJSON.metadata.organization);
    assert.strictEqual(repositoryInfo.data().url, payloadJSON.metadata.url);

    var buildInfo = await client.collection(global.headCollection).doc(repoId).collection('builds').where('buildId', '==', buildId).get();
    let result;
    buildInfo.forEach(r => { result = r; });
    assert.strictEqual(result.data().tests.length, 3);
    assert.strictEqual(result.data().percentpassing, 2.0 / 3.0);
    assert.strictEqual(result.data().environment.ref, 'master');

    // NOTE: Second name is shortened to be doc id length
    const testNames = ['Testing%20Box%20should%20assert%20obj%20is%20instance%20of%20Box', 'Testing%20Box%20should%20assert%20volume%20of%20the%20box%20to%20be', 'Testing%20Box%20should%20throw%20an%20error'];
    for (var i = 0; i < 3; i++) {
      var testInfo = await client.collection(global.headCollection).doc(repoId).collection('tests').doc(testNames[i]).get();
      const testInfoJson = testInfo.data();
      assert.strictEqual(testInfoJson.percentpassing, (i < 2) ? 1 : 0);

      var runInfo = await client.collection(global.headCollection).doc(repoId).collection('tests').doc(testNames[i]).collection('runs').where('buildId', '==', buildId).get();
      let resultRun;
      runInfo.forEach(r => { resultRun = r; });
      assert.strictEqual(resultRun.data().buildId, payloadJSON.metadata.buildId);
    }
  });

  describe('xunit endpoint', async () => {
    const sandbox = sinon.createSandbox();

    afterEach(() => {
      sandbox.restore();
    });

    it('does not allow a post if no password is included', async () => {
      sandbox.stub(AddBuildHandler, 'addBuild');

      const bodyData = fs.readFileSync(require.resolve('./fixtures/passed.xml'), 'utf8');
      process.env.PRIVATE_POSTING_TOKEN = 'hello';

      const resp = await fetch('http://127.0.0.1:3000/api/build/xml', {
        method: 'post',
        body: JSON.stringify({
          data: bodyData,
          metadata: {}
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      assert.strictEqual(resp.status, 401);
      assert.strictEqual(resp.statusText, 'Unauthorized');
    });

    it('calls addBuild with appropriate data when authentication token is included', async () => {
      const addBuildStub = sinon.stub(AddBuildHandler, 'addBuild');
      sandbox.stub(xunitParser, 'parse').returns([]);
      sandbox.stub(xunitParser, 'cleanXunitBuildInfo').returns({});

      const bodyData = fs.readFileSync(require.resolve('./fixtures/passed.xml'), 'utf8');
      process.env.PRIVATE_POSTING_TOKEN = 'hello';

      const resp = await fetch('http://127.0.0.1:3000/api/build/xml', {
        method: 'post',
        body: JSON.stringify({
          data: bodyData,
          metadata: {}
        }),
        headers: { 'content-type': 'application/json', Authorization: process.env.PRIVATE_POSTING_TOKEN }
      });

      assert.strictEqual(resp.status, 200);
      assert(addBuildStub.calledWith([], {}));

      addBuildStub.restore();
    });
  });

  after(async () => {
    var repoIds = [EXAMPLE_PAYLOAD.metadata.repoId, 'nodejs/node'];

    for (let i = 0; i < repoIds.length; i++) {
      await deleteRepo(repoIds[i], client);
    }

    nock.restore();
    nock.cleanAll();
    nock.enableNetConnect();
  });
});
