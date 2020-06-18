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
import {MatToolbarModule} from '@angular/material/toolbar';
import {HomeComponent} from './home.component';
import {Component, Output, EventEmitter} from '@angular/core';
import {AppRoutingModule} from '../app-routing.module';
import {Router} from '@angular/router';
import {By} from '@angular/platform-browser';
import {Location} from '@angular/common';

// Mock the inner components
@Component({
  selector: 'app-search',
})
class SearchComponent {
  @Output() searchOptionSelected = new EventEmitter<string>();
}

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let router: Router;
  let location: Location;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [HomeComponent, SearchComponent],
      imports: [MatToolbarModule, AppRoutingModule],
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
    const searchResult = 'result';
    searchComponent.searchOptionSelected.emit(searchResult);
    tick();
    expect(location.path()).toContain('/search');
    expect(location.path()).toContain(searchResult);
  }));
});
