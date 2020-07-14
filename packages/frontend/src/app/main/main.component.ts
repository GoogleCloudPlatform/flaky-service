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
import {ActivatedRoute, Router} from '@angular/router';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {
  expectedParams,
  InterpretationService,
} from '../services/interpretation/interpretation.service';
import {RouteProvider} from '../routing/route-provider/RouteProvider';

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
    private ngZone: NgZone,
    private router: Router,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const foundParams = this.interpreter.parseRouteParam(
        params,
        expectedParams.get(RouteProvider.routes.main.name)
      );
      const org = foundParams.queries.get('org');
      const repo = foundParams.queries.get('repo');

      const search = {
        query: repo,
        filters: foundParams.filters,
      };

      if (org) search.filters.push({name: 'org', value: org});

      this.searchService.search(search).subscribe();
    });
  }

  openLicenseDialog(): void {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.id = 'license-dialog';

    this.dialog.open(LicenseComponent, dialogConfig);
  }
}
