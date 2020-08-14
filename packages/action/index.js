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
async function main () {
  try {
    // `who-to-greet` input defined in action metadata file
    if (!core.getInput('repo-token') || !core.getInput('os') || !core.getInput('file-path') || !core.getInput('repo-token')) {
      throw 'Github action missing required fields. Refer to documentation at https://github.com/googlecloudplatform/flaky-service';
    }

    let buildmessageStr = process.env.GITHUB_WORKFLOW + ' ' + process.env.GITHUB_RUN_NUMBER;
    if (core.getInput('tag') && core.getInput('tag') !== 'None') {
      buildmessageStr += ' (' + core.getInput('tag') + ')';
    }

    const metaData = {
      repoId: encodeURIComponent(process.env.GITHUB_REPOSITORY), // resanitized server side
      organization: process.env.GITHUB_REPOSITORY.substr(0, process.env.GITHUB_REPOSITORY.indexOf('/')),
      timestamp: new Date(),
      url: process.env.GITHUB_SERVER_URL + '/' + process.env.GITHUB_REPOSITORY,
      environment: {
        os: core.getInput('os'),
        tag: core.getInput('tag'),
        matrix: JSON.parse(core.getInput('matrix')),
        ref: process.env.GITHUB_REF
      },
      buildId: process.env.GITHUB_RUN_ID,
      sha: process.env.GITHUB_SHA,
      name: process.env.GITHUB_REPOSITORY.substr(1 + process.env.GITHUB_REPOSITORY.indexOf('/')),
      description: core.getInput('repo-description'),
      buildmessage: buildmessageStr,
      token: core.getInput('repo-token')
    };

    metaData.environment.matrix = JSON.stringify(metaData.environment.matrix, Object.keys(metaData.environment.matrix).sort()); // consistancy

    metaData.environment.ref = metaData.environment.ref.replace('refs/', '');
    metaData.environment.ref = metaData.environment.ref.replace('heads/', '');

    const fileType = core.getInput('log-type');

    if (!fs.existsSync(core.getInput('file-path'))) {
      core.warning('Could not find a test log file located at ' + core.getInput('file-path'));
      core.warning('Make you are saving a test log before running this action, and that it is saved to the file-path arguement');
      throw 'Could not find File';
    }
    const data = fs.readFileSync(
      core.getInput('file-path'), 'utf8');
    const sendMe = { type: fileType, data: data, metadata: metaData };
    const endpoint = core.getInput('endpoint') + '/api/build/gh/v1';
    console.log('Beginning Upload of data...');
    const outcome = await fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(sendMe),
      headers: { 'Content-Type': 'application/json' }
    });
    const outcomeText = await outcome.text();
    const outcomeAsJSON = JSON.parse(outcomeText);
    if (outcomeAsJSON.error) {
      core.warning('Upload Failed - Status ' + outcome.status);
      core.warning(outcomeAsJSON.error);
      core.warning('See documentation on how to use this action at https://github.com/googlecloudplatform/flaky-service');
      throw 'Upload Failed';
    } else if (outcomeAsJSON.message) {
      console.log('Build Uploaded Successfully!');
      console.log('Visit ' + core.getInput('endpoint') + '/org/' + process.env.GITHUB_REPOSITORY + ' to see uploaded data');
    } else {
      core.warning('Encountered unknown error, possibly involving server issues');
      throw 'Unkown Error';
    }
  } catch (error) {
    core.warning(error);
    process.exitCode = 1;
    core.setFailed(error.message);
  }
}

main();
