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

import {TestBed} from '@angular/core/testing';
import {BuildBatch} from '../interfaces';
import {BatchService} from './batch.service';
import {mockBuilds} from '../../mockBuilds.spec';

describe('BatchService', () => {
  let service: BatchService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BatchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('buildBatches', () => {
    it('should return a batch corresponding to the provided build', () => {
      const builds = [mockBuilds._3PreviousDays[0]];

      const batches: BuildBatch[] = service.buildBatches(builds);

      expect(batches.length).toEqual(1);
      const batch = batches[0];
      expect(batch.builds.length).toEqual(1);
      expect(batch.builds[0]).toEqual(jasmine.objectContaining(builds[0]));
    });

    it('should return every build run the same day in the same batch', () => {
      const builds = [
        mockBuilds._3PreviousDays[0],
        mockBuilds._3PreviousDays[1],
      ];

      const batches: BuildBatch[] = service.buildBatches(builds);

      expect(batches.length).toEqual(1);
      const batch = batches[0];
      expect(batch.builds.length).toEqual(2);
      expect(batch.builds[0]).toEqual(jasmine.objectContaining(builds[0]));
      expect(batch.builds[1]).toEqual(jasmine.objectContaining(builds[1]));
    });

    it('should return builds run on different days in their own batches', () => {
      const builds = [
        mockBuilds._3PreviousDays[0],
        mockBuilds._3PreviousDays[2],
        mockBuilds._3PreviousDays[3],
      ];

      const batches: BuildBatch[] = service.buildBatches(builds);

      expect(batches.length).toEqual(3);
      expect(batches[0].builds.length).toEqual(1);
      expect(batches[0].builds[0]).toEqual(jasmine.objectContaining(builds[0]));

      expect(batches[1].builds.length).toEqual(1);
      expect(batches[1].builds[0]).toEqual(jasmine.objectContaining(builds[1]));

      expect(batches[2].builds.length).toEqual(1);
      expect(batches[2].builds[0]).toEqual(jasmine.objectContaining(builds[2]));
    });

    it('should return unordered builds run on different days in their own batches', () => {
      // unordered builds
      const builds = [
        mockBuilds._3PreviousDays[3],
        mockBuilds._3PreviousDays[2],
        mockBuilds._3PreviousDays[0],
      ];

      const batches: BuildBatch[] = service.buildBatches(builds);

      expect(batches.length).toEqual(3);
      expect(batches[0].builds.length).toEqual(1);
      expect(batches[0].builds[0]).toEqual(jasmine.objectContaining(builds[0]));

      expect(batches[1].builds.length).toEqual(1);
      expect(batches[1].builds[0]).toEqual(jasmine.objectContaining(builds[1]));

      expect(batches[2].builds.length).toEqual(1);
      expect(batches[2].builds[0]).toEqual(jasmine.objectContaining(builds[2]));
    });

    it('should return batches with stats correponding to the contained builds', () => {
      const builds = mockBuilds._3PreviousDays;

      const batches: BuildBatch[] = service.buildBatches(builds);

      expect(batches.length).toEqual(3);

      // 2 passing builds
      expect(batches[0].builds.length).toEqual(2);
      expect(batches[0].passedBuilds).toEqual(2);
      expect(batches[0].failingBuilds).toEqual(0);
      expect(batches[0].flakyBuilds).toEqual(0);

      // 1 failing build
      expect(batches[1].builds.length).toEqual(1);
      expect(batches[1].passedBuilds).toEqual(0);
      expect(batches[1].failingBuilds).toEqual(1);
      expect(batches[1].flakyBuilds).toEqual(0);

      // 1 flaky and passing build
      expect(batches[2].builds.length).toEqual(1);
      expect(batches[2].passedBuilds).toEqual(1);
      expect(batches[2].failingBuilds).toEqual(0);
      expect(batches[2].flakyBuilds).toEqual(1);
    });
  });
});
