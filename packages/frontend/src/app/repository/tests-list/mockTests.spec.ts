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

export const mockTests = {
  tests: [
    {
      failuremessageiffailing: 'Missing characger 1',
      name: 'should update the rendered pages on input change',
      flaky: true,
      passed: false,
      percentpassing: 0.98,
      searchindex: 0,
      lifetimefailcount: 2,
      lifetimepasscount: 18,
      lastupdate: {_seconds: 53400, _nanoseconds: 0},
      environment: {os: 'windows', ref: 'dev'},
    },
    {
      failuremessageiffailing: 'Missing characger 2',
      name:
        'should not return to the first page when the paginator is not ready',
      flaky: false,
      passed: false,
      percentpassing: 0.92,
      searchindex: 0,
      lifetimefailcount: 1,
      lifetimepasscount: 9,
      lastupdate: {_seconds: 63400, _nanoseconds: 0},
      environment: {os: 'windows', ref: 'dev'},
    },
    {
      failuremessageiffailing: 'Missing characger 3',
      name: 'should set the new filters when a repository is found',
      flaky: true,
      passed: true,
      percentpassing: 0.53,
      searchindex: 0,
      lifetimefailcount: 10,
      lifetimepasscount: 12,
      lastupdate: {_seconds: 63400, _nanoseconds: 0},
      environment: {os: 'windows', ref: 'dev'},
    },
  ],
};
