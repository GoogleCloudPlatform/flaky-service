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
import {MainComponent} from './main.component';
import {Component, Output, EventEmitter, Input} from '@angular/core';
import {Search} from '../services/search/interfaces';
import {SearchService} from '../services/search/search.service';
import {AppRoutingModule} from '../routing/app-routing.module';
import {MatDialogModule} from '@angular/material/dialog';
import {of} from 'rxjs';
import {By} from '@angular/platform-browser';
import {Location} from '@angular/common';
import {ActivatedRoute} from '@angular/router';

// Mock the inner components
@Component({
  selector: 'app-repo-list',
})
class RepoListComponent {
  @Input() repositories = [];
}

@Component({
  selector: 'app-search',
})
class SearchComponent {
  @Output() searchOptionSelected = new EventEmitter<Search>();
}

describe('MainComponent', () => {
  let component: MainComponent;
  let fixture: ComponentFixture<MainComponent>;
  let location: Location;

  // Mock services
  const mockSearchService = {repositories: [], search: () => of([])};
  const mockRoute = {params: of()};

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      providers: [
        {provide: SearchService, useValue: mockSearchService},
        {provide: ActivatedRoute, useValue: mockRoute},
      ],
      declarations: [MainComponent, RepoListComponent, SearchComponent],
      imports: [AppRoutingModule, MatDialogModule],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MainComponent);
    component = fixture.componentInstance;
    fixture.autoDetectChanges(true);
    location = TestBed.get(Location);
    mockSearchService.search = () => of([]);
    mockRoute.params = of({});
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should initiate a search when initializing', () => {
      spyOn(mockSearchService, 'search').and.callThrough();

      component.ngOnInit();

      expect(mockSearchService.search).toHaveBeenCalled();
    });

    it('should initiate a search when initializing', () => {
      const searchSpy = spyOn(mockSearchService, 'search').and.callThrough();
      const orgName = 'org';
      mockRoute.params = of({org: orgName});

      component.ngOnInit();

      expect(mockSearchService.search).toHaveBeenCalled();
      const search = (searchSpy.calls.mostRecent().args as Array<
        object
      >)[0] as Search;
      expect(search.filters).toContain(
        jasmine.objectContaining({name: 'org', value: orgName})
      );
    });
  });

  it('should refresh with the new query and filters when the user validates a search in the search bar', fakeAsync(() => {
    const searchComponent: SearchComponent = fixture.debugElement.query(
      By.css('app-search')
    ).componentInstance;
    const searchResult = {
      query: 'repo',
      filters: [{name: 'flaky', value: 'n'}],
    };

    searchComponent.searchOptionSelected.emit(searchResult);

    tick();

    let newLocation = '/search';
    searchResult.filters.forEach(
      filter => (newLocation += ';' + filter.name + '=' + filter.value)
    );

    expect(location.path()).toEqual(newLocation);
  }));
});
