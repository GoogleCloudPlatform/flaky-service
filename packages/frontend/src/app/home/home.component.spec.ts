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

import {
  async,
  ComponentFixture,
  TestBed,
  tick,
  fakeAsync,
} from '@angular/core/testing';
import {HomeComponent} from './home.component';
import {AppRoutingModule} from '../routing/app-routing.module';
import {Router} from '@angular/router';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let router: Router;
  let dialogSpy: jasmine.Spy;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [HomeComponent],
      imports: [AppRoutingModule, MatDialogModule, NoopAnimationsModule],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.autoDetectChanges(true);
    router = TestBed.get(Router);
    fixture.ngZone.run(() => router.initialNavigation());
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should call openLicenseDialog when the license button is clicked', fakeAsync(() => {
    spyOn(component, 'openLicenseDialog');
    const licenseButton = fixture.debugElement.nativeElement.querySelector(
      '#license-button'
    );
    licenseButton.click();
    tick();
    expect(component.openLicenseDialog).toHaveBeenCalled();
  }));

  it('should call the dialog open() function when the license button is clicked', fakeAsync(() => {
    dialogSpy = spyOn(TestBed.get(MatDialog), 'open').and.callThrough();
    component.openLicenseDialog();
    expect(dialogSpy).toHaveBeenCalled();
  }));

  it('should call openLicenseDialog when the license button is clicked', fakeAsync(() => {
    spyOn(component, 'openLicenseDialog');
    const licenseButton = fixture.debugElement.nativeElement.querySelector(
      '#license-button'
    );
    licenseButton.click();
    tick();
    expect(component.openLicenseDialog).toHaveBeenCalled();
  }));

  it('should call the dialog open() function when the license button is clicked', fakeAsync(() => {
    dialogSpy = spyOn(TestBed.get(MatDialog), 'open').and.callThrough();
    component.openLicenseDialog();
    expect(dialogSpy).toHaveBeenCalled();
  }));
});
