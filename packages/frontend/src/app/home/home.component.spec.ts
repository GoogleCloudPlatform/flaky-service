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
import {Component, Output, EventEmitter} from '@angular/core';
import {AppRoutingModule} from '../app-routing.module';
import {Router} from '@angular/router';
import {By} from '@angular/platform-browser';
import {Location} from '@angular/common';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {Search} from '../services/search/interfaces';

// Mock the inner components
@Component({
  selector: 'app-search',
})
class SearchComponent {
  @Output() searchOptionSelected = new EventEmitter<Search>();
}

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let router: Router;
  let location: Location;
  let dialogSpy: jasmine.Spy;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [HomeComponent, SearchComponent],
      imports: [AppRoutingModule, MatDialogModule, NoopAnimationsModule],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.autoDetectChanges(true);
    router = TestBed.get(Router);
    location = TestBed.get(Location);
    fixture.ngZone.run(() => router.initialNavigation());
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should redirect to the main page when a search option is selected', fakeAsync(() => {
    const searchComponent: SearchComponent = fixture.debugElement.query(
      By.css('app-search')
    ).componentInstance;
    const searchResult = {query: 'query', filters: []};
    searchComponent.searchOptionSelected.emit(searchResult);
    tick();
    expect(location.path()).toContain('/search');
    expect(location.path()).toContain(searchResult.query);
  }));

  it('should pass the right filters when redirecting to the main page', fakeAsync(() => {
    const searchComponent: SearchComponent = fixture.debugElement.query(
      By.css('app-search')
    ).componentInstance;
    const searchResult = {
      query: 'repo',
      filters: [{name: 'flaky', value: 'y'}],
    };
    searchComponent.searchOptionSelected.emit(searchResult);

    tick();

    let newLocation = '/search;query=' + searchResult.query;
    searchResult.filters.forEach(
      filter => (newLocation += ';' + filter.name + '=' + filter.value)
    );

    expect(location.path()).toEqual(newLocation);
    expect(location.path()).toContain(searchResult.query);
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
