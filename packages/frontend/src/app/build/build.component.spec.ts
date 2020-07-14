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
  fakeAsync,
  tick,
} from '@angular/core/testing';
import {BuildComponent} from './build.component';
import {Component, Input, Output, EventEmitter} from '@angular/core';
import {Filter} from '../services/search/interfaces';
import {SearchService} from '../services/search/search.service';
import {of} from 'rxjs';
import {AppRoutingModule} from '../routing/app-routing.module';
import {Location} from '@angular/common';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {By} from '@angular/platform-browser';
import {expectedParams} from '../services/interpretation/interpretation.service';

// Mock the inner components
@Component({
  selector: 'app-tests-list',
})
class TestsListComponent {
  @Input() tests = [];
}

@Component({
  selector: 'app-filters',
})
class FiltersComponent {
  setFilters = () => {};
  @Input() set filters(filters) {}
  @Output() filtersChanged = new EventEmitter<Filter[]>();
}

describe('BuildComponent', () => {
  let component: BuildComponent;
  let fixture: ComponentFixture<BuildComponent>;
  let location: Location;

  const getFilters = () => {
    const filters = [];
    let expectedRouteParams = '';
    expectedParams.get('build').filters.forEach(filterName => {
      const filterValue = filterName + 'val';
      filters.push({name: filterName, value: filterValue});
      expectedRouteParams += ';' + filterName + '=' + filterValue;
    });
    return {filters, expectedRouteParams};
  };

  // Mock services
  const mockSearchService = {
    searchBuilds: () => of({metadata: {environments: {}}}),
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      providers: [{provide: SearchService, useValue: mockSearchService}],
      declarations: [BuildComponent, FiltersComponent, TestsListComponent],
      imports: [AppRoutingModule, NoopAnimationsModule],
    }).compileComponents();
    location = TestBed.get(Location);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BuildComponent);
    component = fixture.componentInstance;
    fixture.autoDetectChanges(true);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should redirect/refresh when the filters selection changes', fakeAsync(() => {
    const filterComponent: FiltersComponent = fixture.debugElement.query(
      By.css('app-filters')
    ).componentInstance;

    const {filters, expectedRouteParams} = getFilters();
    const orgName = 'org',
      repoName = 'repo',
      buildId = '345';
    const expectedRoute = encodeURI(
      '/' + orgName + '/' + repoName + '/' + buildId + expectedRouteParams
    );

    component.organisationName = orgName;
    component.repositoryName = repoName;
    component.buildId = buildId;

    filterComponent.filtersChanged.emit(filters);

    tick();

    expect(location.path()).toEqual(expectedRoute);
  }));
});
