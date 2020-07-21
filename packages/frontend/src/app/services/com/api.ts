// Copyright 2020 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {environment} from '../../../environments/environment';

interface ApiLinks {
  get: {
    repositories: string;
    builds: (repoName: string, orgName: string) => string;
    loginLink: string;
    sessionStatus: string;
    tests: (repoName: string, orgName: string) => string;
    repository: (repoName: string, orgName: string) => string;
  };
}

export const apiBaseLink = environment.baseUrl + '/api/';
export const apiLinks: ApiLinks = {
  get: {
    repositories: apiBaseLink + 'repo',
    builds: (repoName: string, orgName: string) =>
      apiBaseLink + 'repo/' + orgName + '/' + repoName,
    loginLink: apiBaseLink + 'auth?redirect=' + environment.baseUrl,
    sessionStatus: apiBaseLink + 'session',
    tests: (repoName: string, orgName: string) =>
      apiBaseLink + 'repo/' + orgName + '/' + repoName + '/tests',
    repository: (repoName: string, orgName: string) =>
      apiBaseLink + 'repo/' + orgName + '/' + repoName,
  },
};
