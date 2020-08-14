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

const moment = require('moment');

const mockBuilds = {
  none: [],
  _3PreviousDays: [
    // Sunday build @ 11:59 pm
    {
      buildId: '1',
      flaky: 0,
      failcount: 0,
      passcount: 1,
      timestamp: {
        _seconds: moment.utc('2000-01-01').day('Sunday').hour(23).minute(59).unix()
      },
      row: 6,
      buildmessage: '1'
    },

    // Sunday build @ 00:00
    {
      buildId: '1.1',
      flaky: 0,
      failcount: 0,
      passcount: 1,
      timestamp: {
        _seconds: moment.utc('2000-01-01').day('Sunday').unix()
      },
      row: 6,
      buildmessage: '2'
    },

    // Monday build
    {
      buildId: '2',
      flaky: 0,
      failcount: 1,
      passcount: 1,
      timestamp: {
        _seconds: moment.utc('2000-01-01').day('Monday').unix()
      },
      row: 5,
      buildmessage: '3'
    },

    // Saturday build
    {
      buildId: '3',
      flaky: 1,
      failcount: 0,
      passcount: 1,
      timestamp: {
        _seconds: moment.utc('2000-01-01').day('Saturday').unix()
      },
      row: 0,
      buildmessage: '4'
    }
  ]
};

module.exports = mockBuilds;
