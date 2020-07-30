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

export const mockBuilds = {
  none: [],
  _3PreviousDays: [
    // Sunday builds
    {
      buildId: '1',
      flaky: 0,
      failcount: 0,
      passcount: 1,
      timestamp: {
        _seconds: moment().subtract(1, 'week').day('Sunday').unix(),
      },
      row: 6,
      expectedColor: hex2rgb(BuildHealthColors.passing),
      buildmessage: '1',
    },
    {
      buildId: '1.1',
      flaky: 0,
      failcount: 0,
      passcount: 1,
      timestamp: {
        _seconds: moment().subtract(1, 'week').day('Sunday').unix(),
      },
      row: 6,
      expectedColor: hex2rgb(BuildHealthColors.passing),
      buildmessage: '2',
    },

    // Monday builds
    {
      buildId: '2',
      flaky: 0,
      failcount: 1,
      passcount: 1,
      timestamp: {
        _seconds: moment().subtract(1, 'week').day('Monday').unix(),
      },
      row: 5,
      expectedColor: hex2rgb(BuildHealthColors.failing),
      buildmessage: '3',
    },

    // Saturday builds
    {
      buildId: '3',
      flaky: 1,
      failcount: 0,
      passcount: 1,
      timestamp: {
        _seconds: moment().subtract(1, 'week').day('Saturday').unix(),
      },
      row: 0,
      expectedColor: hex2rgb(BuildHealthColors.flaky),
      buildmessage: '4',
    },
  ],
};
