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

const { describe, beforeEach, it } = require('mocha');
const assert = require('assert');
const BatchService = require('../util/batches.js');
const mockBuilds = require('./mockBuilds');

describe('BatchService', () => {
  let batchService;

  describe('buildBatches', () => {
    beforeEach(() => { batchService = new BatchService(); });

    it('should return a batch corresponding to the provided build', () => {
      const builds = [mockBuilds._3PreviousDays[0]];

      const batches = batchService.buildBatches(builds);

      assert.strictEqual(batches.length, 1);
      assert.strictEqual(batches[0].passedBuilds, 1);
      assert.strictEqual(batches[0].failingBuilds, 0);
      assert.strictEqual(batches[0].flakyBuilds, 0);
    });

    it('should return batches for builds run on different days', () => {
      const builds = [
        mockBuilds._3PreviousDays[0],
        mockBuilds._3PreviousDays[2],
        mockBuilds._3PreviousDays[3]
      ];

      const batches = batchService.buildBatches(builds);

      assert.strictEqual(batches.length, 3);
    });

    it('should return batches with the provided utc offset', () => {
      const builds = mockBuilds._3PreviousDays;
      const utcOffset = 1;

      const batches = batchService.buildBatches(builds, utcOffset);

      assert.strictEqual(batches.length, 4);
      batches.forEach((batch, index) => assert.strictEqual(batch.timestamp, builds[index].timestamp._seconds));
    });

    it('should return batches with stats correponding to the contained builds', () => {
      const builds = mockBuilds._3PreviousDays;

      const batches = batchService.buildBatches(builds);

      assert.strictEqual(batches.length, 3);

      // 2 passing builds
      assert.strictEqual(batches[0].passedBuilds, 2);
      assert.strictEqual(batches[0].failingBuilds, 0);
      assert.strictEqual(batches[0].flakyBuilds, 0);

      // 1 failing build
      assert.strictEqual(batches[1].passedBuilds, 0);
      assert.strictEqual(batches[1].failingBuilds, 1);
      assert.strictEqual(batches[1].flakyBuilds, 0);

      // 1 flaky and passing build
      assert.strictEqual(batches[2].passedBuilds, 1);
      assert.strictEqual(batches[2].failingBuilds, 0);
      assert.strictEqual(batches[2].flakyBuilds, 1);
    });
  });
});
