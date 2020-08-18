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

class BatchService {
  constructor () { this.utcOffset = 0; }

  buildBatches (builds, utcOffset) {
    this.utcOffset = isNaN(utcOffset) ? 0 : utcOffset;

    const batches = [];
    let newBatch;

    builds.forEach((build, index) => {
      if (newBatch && this._buildBelongsToBatch(newBatch, build)) {
        this._updateBatchStats(newBatch, build);
      } else {
        if (newBatch) {
          delete newBatch.moment;
          batches.push(newBatch);
        }
        newBatch = this._getNewBatch(build);
      }
      const isLastBuild = index === builds.length - 1;
      if (isLastBuild) batches.push(newBatch);
    });

    return batches;
  }

  _buildBelongsToBatch (batch, build) {
    const batchMoment = batch.moment;
    const buildMoment = moment.unix(build.timestamp._seconds).utc().utcOffset(this.utcOffset);
    return batchMoment.isSame(buildMoment, 'day');
  }

  _updateBatchStats (batch, build) {
    batch.failingBuilds += +(build.failcount !== 0);
    batch.passedBuilds += +(build.passcount !== 0 && build.failcount === 0);
    batch.flakyBuilds += +(build.flaky !== 0);
  }

  _getNewBatch (build) {
    const newBatch = {
      timestamp: build.timestamp._seconds,
      passedBuilds: 0,
      flakyBuilds: 0,
      failingBuilds: 0,
      moment: moment.unix(build.timestamp._seconds).utc().utcOffset(this.utcOffset)
    };
    this._updateBatchStats(newBatch, build);
    return newBatch;
  }
}

module.exports = BatchService;
