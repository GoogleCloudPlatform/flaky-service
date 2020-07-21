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

/**
 * main
 */
async function main() {
  try {
    // `who-to-greet` input defined in action metadata file

    const metaData = {
      github: JSON.parse(core.getInput('github')),
      os: JSON.parse(core.getInput('os')),
      matrix: JSON.parse(core.getInput('matrix')),
    };
    const fileType = core.getInput('logtype');
    console.log('reading from: ' + core.getInput('filepath'));
    const data = fs.readFileSync(
        core.getInput('filepath'), 'utf8');

    const sendMe = {type: fileType, data: data, metadata: metaData};
    const endpoint = core.getInput('endpoint') || 'https://flaky-dashboard.web.app/api/build'
    const outcome = await fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(sendMe),
      headers: {'Content-Type': 'application/json'},
    });
    const outcomeText = await outcome.text();
    console.log('\nSERVER RESPONSE:');
    console.log(outcomeText);
  } catch (error) {
    console.log(error);
    core.setFailed(error.message);
  }
}


main();
