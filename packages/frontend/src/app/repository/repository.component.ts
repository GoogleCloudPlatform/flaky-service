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

import {Component, ViewChild, NgZone, AfterViewInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {
  InterpretationService,
  expectedParams,
} from '../services/interpretation/interpretation.service';
import {FiltersComponent} from '../filters/filters.component';
import {Filter} from '../services/search/interfaces';
import {UtilsService} from '../services/utils.service';
import {RouteProvider} from '../routing/route-provider/RouteProvider';
import {COMService} from '../services/com/com.service';
import {catchError} from 'rxjs/operators';
import {NotFoundError} from '../services/com/Errors/NotFoundError';
import {empty} from 'rxjs';
import {TestsListComponent} from './tests-list/tests-list.component';
import {HeatMapComponent} from '../heat-map/heat-map.component';
import {GlobalsService} from '../services/globals/globals.service';

@Component({
  selector: 'app-repository',
  templateUrl: './repository.component.html',
  styleUrls: ['./repository.component.css'],
})
export class RepositoryComponent implements AfterViewInit {
  constructor(
    public com: COMService,
    private route: ActivatedRoute,
    private router: Router,
    private ngZone: NgZone,
    private interpreter: InterpretationService,
    public utils: UtilsService,
    private globals: GlobalsService
  ) {}

  @ViewChild(FiltersComponent) filterComponent;
  @ViewChild(TestsListComponent) testsListComponent;
  @ViewChild(HeatMapComponent) heatMap;

  repoName = '';
  orgName = '';
  testsLoaded = false;
  heatMapLoaded = false;

  ngAfterViewInit(): void {
    setTimeout(() => this.setPageParams());
  }

  setPageParams(): void {
    this.route.params.subscribe(params => {
      const foundParams = this.interpreter.parseRouteParam(
        params,
        expectedParams.get(RouteProvider.routes.repo.name)
      );
      this.repoName = foundParams.queries.get('repo');
      this.orgName = foundParams.queries.get('org');
      this.globals.update(
        RouteProvider.routes.repo.name,
        this.orgName,
        this.repoName
      );
      this.heatMap.init(this.repoName, this.orgName, foundParams.filters);
      this.testsListComponent.update([], this.repoName, this.orgName);

      this.com
        .fetchRepository(this.repoName, this.orgName, foundParams.filters)
        .pipe(
          catchError(err => {
            if (err instanceof NotFoundError) this.redirectTo404();
            return empty();
          })
        )
        .subscribe(repository => {
          this.filterComponent?.setFilters(
            repository.environments,
            foundParams.filters
          );
        });
    });
  }

  onFiltersChanged(filters: Filter[]) {
    this.ngZone.run(() => {
      const route = RouteProvider.routes.repo.link(this.orgName, this.repoName);
      this.router.navigate([route, this.interpreter.getRouteParam(filters)]);
    });
  }

  redirectTo404() {
    this.ngZone.run(() => {
      this.router.navigate([RouteProvider.routes._404.link()]);
    });
  }

  onTestsLoaded() {
    this.testsLoaded = true;
  }

  onHeatMapLoaded() {
    this.heatMapLoaded = true;
  }
}
