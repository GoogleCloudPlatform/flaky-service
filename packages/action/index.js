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

const fetch = require('node-fetch');
const fs = require('fs');
const core = require('@actions/core');
const path = require('path');


try {
  // `who-to-greet` input defined in action metadata file

  const metaData = {
    github: JSON.parse(core.getInput('github')),
    os: JSON.parse(core.getInput('os')),
    matrix: JSON.parse(core.getInput('matrix')),
  };
  const fileType = core.getInput('logtype');
  const data = fs.readFileSync(
      path.resolve(__dirname, '../../flaky-tap-log.tap'), 'utf8');

  const sendMe = JSON.stringify(
      {type: fileType, data: data, metadata: metaData});
  console.log('SENDING: \n\n' + sendMe);

  fetch('https://ptsv2.com/t/sgsey-1592237741/post', {method: 'POST', body: sendMe})
      .then((res) => console.log('\n\n Received: \n\n' + res));
} catch (error) {
  core.setFailed(error.message);
}
