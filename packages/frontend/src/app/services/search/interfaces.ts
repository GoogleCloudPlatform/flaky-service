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

import {PageData} from 'src/app/paginated-list/paginated-list.component';

export interface DefaultRepository {
  name: string;
  organization: string;
}

interface Timestamp {
  _seconds: number;
  _nanoseconds?: number;
}

export interface Repository extends DefaultRepository {
  description?: string;
  flaky?: number;
  numfails?: number;
  repoId?: string;
  numtestcases?: number;
  url?: string;
  environments?: BuildEnvironment;
  lastupdate?: Timestamp;
}

export interface ApiRepositories extends PageData {
  repos: Repository[];
}

export interface Filter {
  name: string;
  value?: string;
}

export interface Search {
  filters: Filter[];
  query: string;
}

export interface Tests extends PageData {
  tests: Test[];
}

export interface Test {
  failuremessageiffailing?: string;
  name?: string;
  flaky?: boolean;
  passed?: boolean;
  searchindex?: number;
  lifetimefailcount?: number;
  lifetimepasscount?: number;
  percentpassing?: number;
  environments?: BuildEnvironment;
  lastupdate: Timestamp;
}

export interface BuildEnvironment {
  os: string;
  environment?: string;
  ref?: string;
  tag?: string;
}

export interface Build {
  buildId: string;
  environment?: BuildEnvironment;
  flaky?: number;
  timestamp?: Timestamp;
  percentpassing?: number;
  successes?: string[];
  tests?: Test[];
  failcount?: number;
  passcount?: number;
  buildmessage?: string;
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
