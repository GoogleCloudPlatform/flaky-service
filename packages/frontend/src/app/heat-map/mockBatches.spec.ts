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

import {BuildHealthColors} from './services/heat-map/providers/colors';
import * as moment from 'moment';

//helper
const hex2rgb = hex =>
  'rgb(' +
  parseInt('' + hex[1] + hex[2], 16) +
  ', ' +
  parseInt('' + hex[3] + hex[4], 16) +
  ', ' +
  parseInt('' + hex[5] + hex[6], 16) +
  ')';

export const mockBatches = {
  none: [],
  _3PreviousDays: [
    // Sunday builds
    {
      failingBuilds: 0,
      flakyBuilds: 0,
      passedBuilds: 2,
      timestamp: moment().subtract(1, 'week').day('Sunday').unix(),
      expectedColor: hex2rgb(BuildHealthColors.passing),
      row: 6,
    },

    // Monday builds
    {
      failingBuilds: 1,
      flakyBuilds: 0,
      passedBuilds: 0,
      timestamp: moment().subtract(1, 'week').day('Monday').unix(),
      expectedColor: hex2rgb(BuildHealthColors.failing),
      row: 5,
    },

    // Saturday builds
    {
      failingBuilds: 0,
      flakyBuilds: 1,
      passedBuilds: 1,
      timestamp: moment().subtract(1, 'week').day('Saturday').unix(),
      expectedColor: hex2rgb(BuildHealthColors.flaky),
      row: 0,
    },
  ],
};
