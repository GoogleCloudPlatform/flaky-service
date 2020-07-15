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

export interface DefaultRepository {
  name: string;
  organization: string;
}

export interface Repository extends DefaultRepository {
  description?: string;
  flaky?: number;
  numfails?: number;
  repoId?: string;
  numtestcases?: number;
  url?: string;
  environments?: BuildEnvironment;
}

export interface Filter {
  name: string;
  value?: string;
}

export interface Search {
  filters: Filter[];
  query: string;
}

export interface Test {
  name: string;
  flaky: boolean;
  failing: boolean;
  numfails: number;
  percentpassing: number;
  timestamp: {_seconds: number};
  environment: BuildEnvironment;
}

export interface BuildEnvironment {
  os: string;
  environment?: string;
  ref?: string;
  tag?: string;
}

export interface Build {
  buildId: string;
  environment: BuildEnvironment;
  flaky: number;
  timestamp: {_seconds: number};
  percentpassing: number;
  successes?: string[];
  tests?: Test[];
  numfails: number;
  // TODO: temporary fields. Remove when the format is fully clear.
  numPass: number;
}

export interface ApiRepository {
  metadata: Repository;
  builds: Build[];
}

export interface SessionStatus {
  permitted: boolean;
  expiration?: Date;
  login?: string;
}
