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
import {Router} from '@angular/router';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {Search} from '../services/search/interfaces';
import {LicenseComponent} from '../license/license.component';
import {InterpretationService} from '../services/interpretation/interpretation.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  constructor(
    private ngZone: NgZone,
    private router: Router,
    private interpreter: InterpretationService,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {}

  openLicenseDialog(): void {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.height = '500px';
    dialogConfig.width = '800px';
    dialogConfig.id = 'license-dialog';

    this.dialog.open(LicenseComponent, dialogConfig);
  }

  onSearchOptionSelected(option: Search): void {
    this.ngZone.run(() => {
      this.router.navigate(['search', this.interpreter.getQueryObject(option)]);
    });
  }
}
