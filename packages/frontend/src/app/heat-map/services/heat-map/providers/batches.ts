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

import {moment, BuildBatch, BuildHealth} from '../../interfaces';

export class BatchesProvider {
  setUpBatches(
    batches: BuildBatch[],
    weeksToDisplay: number,
    daysToDisplay: number
  ): BuildBatch[] {
    const newBatches = [];
    let batchIndex = 0;

    const batchMoment = moment().subtract(weeksToDisplay - 1, 'weeks');
    batchMoment.day(0);

    for (let xDomainIndex = 0; xDomainIndex < weeksToDisplay; xDomainIndex++) {
      for (let yDomainIndex = 0; yDomainIndex < daysToDisplay; yDomainIndex++) {
        const batchesFinished = batchIndex >= batches.length;

        if (batchesFinished)
          newBatches.push(this.defaultBatch(xDomainIndex, batchMoment));
        else {
          const batch = batches[batchIndex];

          if (batch.moment.local().isSame(batchMoment, 'day')) {
            batch['x'] = xDomainIndex;
            batch['y'] = batch.moment.day().toString();
            batch['health'] = this.getBatchHealth(batch);

            newBatches.push(batch);
            batchIndex++;
          } else {
            newBatches.push(this.defaultBatch(xDomainIndex, batchMoment));
          }
        }
        batchMoment.add(1, 'day');
      }
    }
    return newBatches;
  }

  private defaultBatch(xDomainIndex: number, batchMoment: moment.Moment) {
    return {
      builds: [],
      failingBuilds: 0,
      flakyBuilds: 0,
      passedBuilds: 0,
      x: xDomainIndex,
      y: batchMoment.day().toString(),
      moment: batchMoment.clone(),
      health: BuildHealth.none,
    };
  }

  private getBatchHealth(batch: BuildBatch): BuildHealth {
    let health = BuildHealth.none;
    if (batch.failingBuilds) health = BuildHealth.failing;
    if (!batch.failingBuilds && batch.flakyBuilds) health = BuildHealth.flaky;
    if (!batch.failingBuilds && !batch.flakyBuilds && batch.passedBuilds)
      health = BuildHealth.passing;
    return health;
  }
}
