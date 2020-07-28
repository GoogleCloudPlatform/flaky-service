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

import {TestBed, async, fakeAsync, tick} from '@angular/core/testing';
import {RouterTestingModule} from '@angular/router/testing';
import {AppComponent} from './app.component';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatIconModule} from '@angular/material/icon';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatListModule} from '@angular/material/list';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {Component} from '@angular/core';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';

// Mock the inner components

@Component({
  selector: 'app-config',
})
class ConfigComponent {}

@Component({
  selector: 'app-breadcrumbs',
})
class BreadcrumbsComponent {}

@Component({
  selector: 'app-search',
})
class SearchComponent {}

describe('AppComponent', () => {
  let fixture;
  let app: AppComponent;
  let dialogSpy: jasmine.Spy;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        RouterTestingModule,
        MatToolbarModule,
        MatIconModule,
        MatSidenavModule,
        MatListModule,
        MatDialogModule,
      ],
      declarations: [
        AppComponent,
        BreadcrumbsComponent,
        SearchComponent,
        ConfigComponent,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    app = fixture.componentInstance;
  }));

  it('should create the app', () => {
    expect(app).toBeTruthy();
  });

  it('should call openLicenseDialog when the license button is clicked', fakeAsync(() => {
    spyOn(app, 'openLicenseDialog');
    const licenseButton = fixture.debugElement.nativeElement.querySelector(
      '#license-button'
    );
    licenseButton.click();
    tick();
    expect(app.openLicenseDialog).toHaveBeenCalled();
  }));

  it('should call the dialog open() function when the license button is clicked', fakeAsync(() => {
    dialogSpy = spyOn(TestBed.get(MatDialog), 'open').and.callThrough();
    app.openLicenseDialog();
    expect(dialogSpy).toHaveBeenCalled();
  }));
});
