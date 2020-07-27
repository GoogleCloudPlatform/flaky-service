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

import {Component, OnInit, NgZone} from '@angular/core';
import {LicenseComponent} from '../license/license.component';
import {SearchService} from '../services/search/search.service';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {
  expectedParams,
  InterpretationService,
} from '../services/interpretation/interpretation.service';
import {RouteProvider} from '../routing/route-provider/RouteProvider';
import {Repository, Filter} from '../services/search/interfaces';
import {finalize} from 'rxjs/operators';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css'],
})
export class MainComponent implements OnInit {
  constructor(
    public searchService: SearchService,
    private route: ActivatedRoute,
    private interpreter: InterpretationService,
    public dialog: MatDialog,
    private router: Router,
    private ngZone: NgZone
  ) {}

  repositories: Repository[] = [];
  loading = true;
  orgName = '';
  repoName = '';
  filters = {
    orderby: ['activity', 'name', 'priority'],
  };

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const search = this.getSearch(params);
      this.searchService
        .search(search, this.orgName)
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe(repositories => {
          this.repositories = repositories;
        });
    });
  }

  private getSearch(params: Params) {
    const foundParams = this.interpreter.parseRouteParam(
      params,
      expectedParams.get(RouteProvider.routes.main.name)
    );

    this.orgName = foundParams.queries.get('org');
    this.repoName = foundParams.queries.get('repo');

    const search = {
      query: this.repoName,
      filters: foundParams.filters,
    };

    return search;
  }

  onFiltersChanged(filters: Filter[]) {
    this.ngZone.run(() => {
      const route = RouteProvider.routes.main.link(this.orgName);
      this.router.navigate([route, this.interpreter.getRouteParam(filters)]);
    });
  }

  openLicenseDialog(): void {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.id = 'license-dialog';

    this.dialog.open(LicenseComponent, dialogConfig);
  }
}
