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

// checks to see if installation token is valid and is linked to this repository
async function validateGithub (token, repo) {
  /* Equivalent to doing
  *  curl -i -H "Authorization: token MYTOKENHERE" -H "Accept: application/vnd.github.machine-man-preview+json" https://api.github.com/installation/repositories
  *  see https://developer.github.com/apps/building-github-apps/authenticating-with-github-apps/#authenticating-as-an-installation
  */
  const resp = await fetch('https://api.github.com/installation/repositories', {
    method: 'GET',
    headers: {
      Authorization: 'token ' + token,
      Accept: 'application/vnd.github.machine-man-preview+json'
    }
  });
  if (resp.status !== 200) {
    return false;
  }

  const respJSON = await resp.json();

  if (!respJSON.repositories.length) {
    return false;
  }

  for (const repoListed of respJSON.repositories) {
    if (!repoListed.full_name) {
      return false;
    }
    if (repoListed.full_name.toLowerCase() === repo.toLowerCase()) {
      return true;
    }
  }
  return false;
}

module.exports = { validateGithub };
