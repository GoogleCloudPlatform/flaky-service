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

import {Component, OnInit, ViewChild, NgZone} from '@angular/core';
import {SearchService} from '../services/search/search.service';
import {ActivatedRoute, Router} from '@angular/router';
import {LicenseComponent} from '../license/license.component';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {
  InterpretationService,
  expectedParams,
} from '../services/interpretation/interpretation.service';
import {FiltersComponent} from '../filters/filters.component';
import {Observable} from 'rxjs';
import {Filter, Test} from '../services/search/interfaces';
import {UtilsService} from '../services/utils.service';
import {RouteProvider} from '../routing/route-provider/RouteProvider';
import { COMService } from '../services/com/com.service';

@Component({
  selector: 'app-repository',
  templateUrl: './repository.component.html',
  styleUrls: ['./repository.component.css'],
})
export class RepositoryComponent implements OnInit {
  /*
  mockTests: Test[] = [
    {
      name: 'should update the rendered pages on input change',
      flaky: true,
      failing: true,
      percentpassing: 98,
      numfails: 4,
      timestamp: {_seconds: 5400},
      environment: {os: 'windows', ref: 'dev'},
    },
    {
      name:
        'should not return to the first page when the paginator is not ready',
      flaky: false,
      failing: true,
      percentpassing: 92,
      numfails: 6,
      timestamp: {_seconds: 5400},
      environment: {os: 'windows', ref: 'dev'},
    },
    {
      name: 'should set the new filters when a repository is found',
      flaky: true,
      failing: false,
      percentpassing: 53,
      numfails: 13,
      timestamp: {_seconds: 2220},
      environment: {os: 'windows', ref: 'dev'},
    },
    {
      name: 'should redirect/refresh when the filters selection changes',
      flaky: true,
      failing: false,
      percentpassing: 66,
      numfails: 7,
      timestamp: {_seconds: 1593432000},
      environment: {os: 'windows', ref: 'dev'},
    },
    {
      name: 'should create',
      flaky: false,
      failing: false,
      percentpassing: 100,
      numfails: 0,
      timestamp: {_seconds: 1593331000},
      environment: {os: 'windows', ref: 'dev'},
    },
    {
      name: 'should initialize view',
      flaky: false,
      failing: false,
      percentpassing: 100,
      numfails: 0,
      timestamp: {_seconds: 2820},
      environment: {os: 'windows', ref: 'dev'},
    },
  ];
  */

  constructor(
    public searchService: SearchService,
    private comService: COMService,
    private route: ActivatedRoute,
    private router: Router,
    private ngZone: NgZone,
    private interpreter: InterpretationService,
    public utils: UtilsService,
    public dialog: MatDialog
  ) {}

  @ViewChild(FiltersComponent) filterComponent;

  repoName = '';
  orgName = '';

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const foundParams = this.interpreter.parseRouteParam(
        params,
        expectedParams.get(RouteProvider.routes.repo.name)
      );
      this.repoName = foundParams.queries.get('repo');
      this.orgName = foundParams.queries.get('org');

      this.searchService
        .searchBuilds(this.repoName, this.orgName, foundParams.filters)
        .subscribe(repository => {
          this.filterComponent?.setFilters(
            repository.metadata.environments,
            foundParams.filters
          );
        });
    });
  }

  openLicenseDialog(): void {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.id = 'license-dialog';

    this.dialog.open(LicenseComponent, dialogConfig);
  }

  onFiltersChanged(filters: Filter[]) {
    this.ngZone.run(() => {
      const route = this.orgName + '/' + this.repoName;
      this.router.navigate([route, this.interpreter.getRouteParam(filters)]);
    });
  }

  getTests(): Observable<Test[]> {
    return this.comService.fetchTests(this.repoName, this.orgName);
  }
}
