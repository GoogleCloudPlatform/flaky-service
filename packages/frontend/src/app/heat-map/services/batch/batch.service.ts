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

import {Injectable} from '@angular/core';
import {Build, BuildBatch, moment} from '../interfaces';

@Injectable({
  providedIn: 'root',
})
export class BatchService {
  public buildBatches(builds: Build[]): BuildBatch[] {
    builds = this.sortByTimeStamp(builds);

    const batches: BuildBatch[] = [];
    let newBatch: BuildBatch;

    builds.forEach((build, index) => {
      if (newBatch && this.buildBelongsToBatch(newBatch, build)) {
        newBatch.builds.push(build);
        this.updateBatchStats(newBatch, build);
      } else {
        if (newBatch) batches.push(newBatch);
        newBatch = this.getNewBatch(build);
      }
      const isLastBuild = index === builds.length - 1;
      if (isLastBuild) batches.push(newBatch);
    });

    return batches;
  }

  private sortByTimeStamp(builds: Build[]): Build[] {
    return builds.sort(
      (buildA, buildB) => buildA.timestamp._seconds - buildB.timestamp._seconds
    );
  }

  private buildBelongsToBatch(batch: BuildBatch, build: Build): boolean {
    const batchMoment = batch.moment;
    const buildMoment = moment.unix(build.timestamp._seconds).utc();
    return batchMoment.isSame(buildMoment, 'day');
  }

  private updateBatchStats(batch: BuildBatch, build: Build) {
    batch.failingBuilds += +(build.failcount !== 0);
    batch.passedBuilds += +(build.passcount !== 0 && build.failcount === 0);
    batch.flakyBuilds += +(build.flaky !== 0);
  }

  private getNewBatch(build: Build): BuildBatch {
    const newBatch = {
      builds: [build],
      passedBuilds: 0,
      flakyBuilds: 0,
      failingBuilds: 0,
      moment: moment.unix(build.timestamp._seconds).utc(),
    };
    this.updateBatchStats(newBatch, build);
    return newBatch;
  }
}
