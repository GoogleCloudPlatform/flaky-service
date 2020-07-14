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

import {RouteProvider} from './RouteProvider';

describe('RouteProvider', () => {
  it('should return a route link corresponding to the provided parameters', () => {
    const orgName = 'org';
    const repoName = 'repo';

    expect(RouteProvider.routes.main.link(orgName)).toEqual('org/' + orgName);
    expect(RouteProvider.routes.repo.link(orgName, repoName)).toEqual(
      'org/' + orgName + '/' + repoName
    );
  });
});
