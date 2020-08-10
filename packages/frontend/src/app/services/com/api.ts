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
    repositories: (orgName: string) => string;
    builds: (repoName: string, orgName: string) => string;
    tests: (repoName: string, orgName: string) => string;
    repository: (repoName: string, orgName: string) => string;
    deleteTest: (
      orgName: string,
      repoName: string,
      testName: string,
      redirect: string
    ) => string;
  };
  post: {
    authLink: string;
  };
}

export const apiBaseLink = environment.baseUrl + '/api/';
export const apiLinks: ApiLinks = {
  get: {
    repositories: (orgName: string) => apiBaseLink + 'org/' + orgName,
    builds: (repoName: string, orgName: string) =>
      apiBaseLink + 'repo/' + orgName + '/' + repoName + '/builds',
    tests: (repoName: string, orgName: string) =>
      apiBaseLink + 'repo/' + orgName + '/' + repoName + '/tests',
    repository: (repoName: string, orgName: string) =>
      apiBaseLink + 'repo/' + orgName + '/' + repoName,
    deleteTest: (
      orgName: string,
      repoName: string,
      testName: string,
      redirect: string
    ) =>
      apiBaseLink +
      'repo/deleteurl/' +
      encodeURIComponent(orgName) +
      '/' +
      encodeURIComponent(repoName) +
      '?testname=' +
      encodeURIComponent(testName) +
      '&redirect=' +
      encodeURIComponent(redirect),
  },
  post: {
    authLink: apiBaseLink + 'auth',
  },
};
