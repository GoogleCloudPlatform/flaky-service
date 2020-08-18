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

import {Component, ViewChild, Output} from '@angular/core';
import {
  Congifuration,
  HeatMapService,
} from './services/heat-map/heat-map.service';
import {BuildBatch, Build} from './services/interfaces';
import {MatSidenav} from '@angular/material/sidenav';
import {UtilsService} from '../services/utils.service';
import {COMService} from '../services/com/com.service';
import {EventEmitter} from '@angular/core';
import {Filter} from '../services/search/interfaces';
import {finalize} from 'rxjs/operators';

@Component({
  selector: 'app-heat-map',
  templateUrl: './heat-map.component.html',
  styleUrls: ['./heat-map.component.css'],
})
export class HeatMapComponent {
  readonly dataHolderSelector = '#data-holder';
  readonly config: Congifuration = {
    width: 700,
    height: 110,
    margins: {top: 15, bottom: 0, right: 5, left: 20},
    weeksToDisplay: 45,
    daysToDisplay: 7,
  };

  builds = [];
  selectedBuilds = [];
  selectedBatchDate = '';

  orgName = '';
  repoName = '';
  filters = [];
  @Output() loadingComplete: EventEmitter<void> = new EventEmitter();
  @ViewChild(MatSidenav) sidenave: MatSidenav;

  constructor(
    private heatMapService: HeatMapService,
    public utils: UtilsService,
    private com: COMService
  ) {}

  init(repoName: string, orgName: string, filters: Filter[] = []): void {
    this.repoName = repoName;
    this.orgName = orgName;
    this.filters = filters;
    this.com
      .fetchBatches(this.repoName, this.orgName, filters)
      .pipe(finalize(() => this.loadingComplete.emit()))
      .subscribe(batches => {
        this.drawMap(batches).subscribe(batch => {
          this.onBatchClick(batch);
        });
      });
  }

  private drawMap(batches: BuildBatch[]): EventEmitter<BuildBatch> {
    return this.heatMapService.draw(
      this.config,
      batches,
      this.dataHolderSelector
    );
  }

  private onBatchClick(batch: BuildBatch) {
    if (batch.isDefault) return;

    // Fetch the builds only once per batch
    if (batch.builds) this.showBuilds(batch);
    else {
      this.com
        .fetchBatch(this.repoName, this.orgName, batch.timestamp, this.filters)
        .subscribe(builds => {
          batch.builds = builds;
          this.showBuilds(batch);
        });
    }
  }

  private showBuilds(batch: BuildBatch) {
    this.selectedBuilds = batch.builds;
    this.selectedBatchDate = batch.moment.format('MMM D, YYYY');
    this.sidenave.open();
  }

  getBuildLink(buildId): string {
    return 'https://github.com/'.concat(
      this.orgName,
      '/',
      this.repoName,
      '/actions/runs/',
      buildId
    );
  }

  buildIsFlaky(build: Build) {
    return !build.failcount && build.flaky;
  }

  buildIsPassing(build: Build) {
    return !build.failcount && !build.flaky;
  }

  getBuildRunText(build: Build): string {
    return build.buildmessage ? build.buildmessage : build.buildId;
  }
}
