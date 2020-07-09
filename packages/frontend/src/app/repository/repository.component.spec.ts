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
import {RepositoryComponent} from './repository.component';
import {Component, Input, Output, EventEmitter} from '@angular/core';
import {Search, Filter} from '../services/search/interfaces';
import {SearchService} from '../services/search/search.service';
import {of} from 'rxjs';
import {AppRoutingModule} from '../app-routing.module';
import {Location} from '@angular/common';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {By} from '@angular/platform-browser';
import {expectedParams} from '../services/interpretation/interpretation.service';

// Mock the inner components
@Component({
  selector: 'app-build-list',
})
class BuildListComponent {
  @Input() builds = [];
  @Input() repoName = '';
  @Input() orgName = '';
}

@Component({
  selector: 'app-search',
})
class SearchComponent {
  @Output() searchOptionSelected = new EventEmitter<Search>();
}

@Component({
  selector: 'app-filters',
})
class FiltersComponent {
  setFilters = () => {};
  @Input() set filters(filters) {}
  @Output() filtersChanged = new EventEmitter<Filter[]>();
}

describe('RepositoryComponent', () => {
  let component: RepositoryComponent;
  let fixture: ComponentFixture<RepositoryComponent>;
  let location: Location;

  const getFilters = () => {
    const filters = [];
    let expectedRouteParams = '';
    expectedParams.get('repo').filters.forEach(filterName => {
      const filterValue = filterName + 'val';
      filters.push({name: filterName, value: filterValue});
      expectedRouteParams += ';' + filterName + '=' + filterValue;
    });
    return {filters, expectedRouteParams};
  };

  const getEnvironments = () => {
    const {filters} = getFilters();
    const environments = {};
    filters.forEach(filter => {
      environments[filter] = ['val1', 'val2'];
    });
    return environments;
  };

  // Mock services
  const mockSearchService = {
    searchBuilds: () => of({metadata: {environments: {}}}),
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      providers: [{provide: SearchService, useValue: mockSearchService}],
      declarations: [
        RepositoryComponent,
        BuildListComponent,
        SearchComponent,
        FiltersComponent,
      ],
      imports: [AppRoutingModule, NoopAnimationsModule],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RepositoryComponent);
    component = fixture.componentInstance;
    fixture.autoDetectChanges(true);
    mockSearchService.searchBuilds = () => of({metadata: {environments: {}}});
    location = TestBed.get(Location);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set the new filters when a repository is found', done => {
    const environments = getEnvironments();
    component.filterComponent = {
      setFilters: env => {
        expect(env).toEqual(jasmine.objectContaining(environments));
        done();
      },
    };

    mockSearchService.searchBuilds = () =>
      of({metadata: {environments: getEnvironments()}});

    component.ngOnInit();
  });

  it('should redirect/refresh when the filters selection changes', fakeAsync(() => {
    const filterComponent: FiltersComponent = fixture.debugElement.query(
      By.css('app-filters')
    ).componentInstance;

    const {filters, expectedRouteParams} = getFilters();
    const orgName = 'org',
      repoName = 'repo';
    const expectedRoute = '/' + orgName + '/' + repoName + expectedRouteParams;

    component.orgName = orgName;
    component.repoName = repoName;

    filterComponent.filtersChanged.emit(filters);

    tick();

    expect(location.path()).toEqual(expectedRoute);
  }));

  it('should redirect to the 404 page if no repository was found', () => {
    // TODO
  });
});
