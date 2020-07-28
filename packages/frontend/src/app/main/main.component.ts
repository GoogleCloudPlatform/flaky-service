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

import {Component, NgZone, ViewChild, AfterViewInit} from '@angular/core';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {
  expectedParams,
  InterpretationService,
} from '../services/interpretation/interpretation.service';
import {RouteProvider} from '../routing/route-provider/RouteProvider';
import {Filter} from '../services/search/interfaces';
import {RepoListComponent} from './repo-list/repo-list.component';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css'],
})
export class MainComponent implements AfterViewInit {
  constructor(
    private route: ActivatedRoute,
    private interpreter: InterpretationService,
    private router: Router,
    private ngZone: NgZone
  ) {}

  @ViewChild(RepoListComponent) reposListComponent;

  loading = true;
  orgName = '';
  repoName = '';
  filters = {
    orderby: [
      {value: 'activity', visibleValue: 'last update'},
      'name',
      'priority',
    ],
  };

  ngAfterViewInit(): void {
    setTimeout(() =>
      this.route.params.subscribe(params => this.setPageParams(params))
    );
  }

  private setPageParams(params: Params): void {
    const foundParams = this.interpreter.parseRouteParam(
      params,
      expectedParams.get(RouteProvider.routes.main.name)
    );
    this.orgName = foundParams.queries.get('org');
    this.repoName = foundParams.queries.get('repo');
    this.reposListComponent.update(
      foundParams.filters,
      this.repoName,
      this.orgName
    );
  }

  onReposLoaded() {
    this.loading = false;
  }

  onFiltersChanged(filters: Filter[]) {
    this.ngZone.run(() => {
      const route = RouteProvider.routes.main.link(this.orgName);
      this.router.navigate([route, this.interpreter.getRouteParam(filters)]);
    });
  }
}
