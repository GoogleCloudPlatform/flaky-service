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
import {AppRoutingModule} from '../app-routing.module';
import {of} from 'rxjs';
import {By} from '@angular/platform-browser';
import {Location} from '@angular/common';

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

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      providers: [{provide: SearchService, useValue: mockSearchService}],
      declarations: [MainComponent, RepoListComponent, SearchComponent],
      imports: [AppRoutingModule],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MainComponent);
    component = fixture.componentInstance;
    fixture.autoDetectChanges(true);
    location = TestBed.get(Location);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initiate a search when initializing', () => {
    spyOn(mockSearchService, 'search').and.callThrough();

    component.ngOnInit();

    expect(mockSearchService.search).toHaveBeenCalled();
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

    let newLocation = '/search;query=' + searchResult.query;
    searchResult.filters.forEach(
      filter => (newLocation += ';' + filter.name + '=' + filter.value)
    );

    expect(location.path()).toEqual(newLocation);
  }));
});
