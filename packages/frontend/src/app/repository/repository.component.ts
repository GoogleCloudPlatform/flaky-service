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
import {ActivatedRoute, Router} from '@angular/router';
import {LicenseComponent} from '../license/license.component';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {
  InterpretationService,
  expectedParams,
} from '../services/interpretation/interpretation.service';
import {FiltersComponent} from '../filters/filters.component';
import {Filter} from '../services/search/interfaces';
import {UtilsService} from '../services/utils.service';
import {RouteProvider} from '../routing/route-provider/RouteProvider';
import {COMService} from '../services/com/com.service';

@Component({
  selector: 'app-repository',
  templateUrl: './repository.component.html',
  styleUrls: ['./repository.component.css'],
})
export class RepositoryComponent implements OnInit {
  constructor(
    public com: COMService,
    private route: ActivatedRoute,
    private router: Router,
    private ngZone: NgZone,
    private interpreter: InterpretationService,
    public utils: UtilsService,
    public dialog: MatDialog
  ) {}

  @ViewChild(FiltersComponent) filterComponent;

  repoName = ' ';
  orgName = ' ';

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const foundParams = this.interpreter.parseRouteParam(
        params,
        expectedParams.get(RouteProvider.routes.repo.name)
      );
      this.repoName = foundParams.queries.get('repo');
      this.orgName = foundParams.queries.get('org');

      this.com
        .fetchRepository(this.repoName, this.orgName, foundParams.filters)
        .subscribe(repository => {
          this.filterComponent?.setFilters(
            repository.environments,
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
      const route = RouteProvider.routes.repo.link(this.orgName, this.repoName);
      this.router.navigate([route, this.interpreter.getRouteParam(filters)]);
    });
  }
}
