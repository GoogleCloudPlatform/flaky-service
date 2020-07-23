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
import {Component, Input, Output, EventEmitter} from '@angular/core';
import {Search, Filter, Repository} from '../services/search/interfaces';
import {SearchService} from '../services/search/search.service';
import {AppRoutingModule} from '../routing/app-routing.module';
import {MatDialogModule} from '@angular/material/dialog';
import {of} from 'rxjs';
import {ActivatedRoute} from '@angular/router';
import {By} from '@angular/platform-browser';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {RouteProvider} from '../routing/route-provider/RouteProvider';
import {Location} from '@angular/common';

// Mock the inner components
@Component({
  selector: 'app-repo-list',
})
class RepoListComponent {
  @Input() repositories = [];
}

@Component({
  selector: 'app-filters',
})
class FiltersComponent {
  setFilters = () => {};
  @Input() set filters(filters) {}
  @Output() filtersChanged = new EventEmitter<Filter[]>();
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
      declarations: [MainComponent, RepoListComponent, FiltersComponent],
      imports: [AppRoutingModule, MatDialogModule, MatProgressSpinnerModule],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MainComponent);
    component = fixture.componentInstance;
    fixture.autoDetectChanges(true);
    mockSearchService.search = () => of([]);
    mockRoute.params = of({});
    location = TestBed.get(Location);
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

    it('should initiate a search with the provided filters when initializing', () => {
      mockRoute.params = of({orderby: 'priority'});
      const searchSpy = spyOn(mockSearchService, 'search').and.callThrough();

      component.ngOnInit();

      expect(mockSearchService.search).toHaveBeenCalled();
      const search = (searchSpy.calls.mostRecent().args as Array<
        object
      >)[0] as Search;
      expect(search.filters).toContain(
        jasmine.objectContaining({name: 'orderby', value: 'priority'})
      );
    });

    it('should hide the spinner when repositories are received', fakeAsync(() => {
      spyOn(mockSearchService, 'search').and.returnValue(of([{}]));

      component.ngOnInit();
      fixture.detectChanges();
      tick();

      const spinner = fixture.debugElement.query(By.css('#spinner'));
      expect(spinner).toBeNull();
    }));

    it('should show the no-repo text when no repositories were found', fakeAsync(() => {
      spyOn(mockSearchService, 'search').and.returnValue(of([]));

      component.ngOnInit();
      fixture.detectChanges();
      tick();

      const noRepoText = fixture.debugElement.query(By.css('#no-repo-found'));
      expect(noRepoText).not.toBeNull();
    }));

    it('should hide the no-repo text when repositories were found', fakeAsync(() => {
      spyOn(mockSearchService, 'search').and.returnValue(of([{}]));

      component.ngOnInit();
      fixture.detectChanges();
      tick();

      const noRepoText = fixture.debugElement.query(By.css('#no-repo-found'));
      expect(noRepoText).toBeNull();
    }));
  });

  it('should hide the filters when no repository was found', fakeAsync(() => {
    component.repositories = [];
    component.loading = false;
    component.repoName = '';
    fixture.detectChanges();
    tick();

    const filterComponent = fixture.debugElement.query(By.css('app-filters'));

    expect(filterComponent).toBeNull();
  }));

  it('should hide the filters when only 1 repository was found', fakeAsync(() => {
    component.repositories = [{} as Repository];
    component.loading = false;
    component.repoName = '';
    fixture.detectChanges();
    tick();

    const filterComponent = fixture.debugElement.query(By.css('app-filters'));

    expect(filterComponent).toBeNull();
  }));

  it('should hide the filters while the page is loading', fakeAsync(() => {
    component.repositories = [{} as Repository, {} as Repository];
    component.loading = true;
    component.repoName = '';
    fixture.detectChanges();
    tick();

    const filterComponent = fixture.debugElement.query(By.css('app-filters'));

    expect(filterComponent).toBeNull();
  }));

  it('should hide the filters when a repository is being searched', fakeAsync(() => {
    component.repositories = [{} as Repository, {} as Repository];
    component.loading = false;
    component.repoName = 'repo';
    fixture.detectChanges();
    tick();

    const filterComponent = fixture.debugElement.query(By.css('app-filters'));

    expect(filterComponent).toBeNull();
  }));

  it('should show the filters when all conditions are met', fakeAsync(() => {
    component.repositories = [{} as Repository, {} as Repository];
    component.loading = false;
    component.repoName = '';
    fixture.detectChanges();
    tick();

    const filterComponent = fixture.debugElement.query(By.css('app-filters'));

    expect(filterComponent).not.toBeNull();
  }));

  it('should redirect/refresh when the filters selection changes', fakeAsync(() => {
    component.repositories = [{} as Repository, {} as Repository];
    component.loading = false;
    fixture.detectChanges();
    tick();

    const filterComponent: FiltersComponent = fixture.debugElement.query(
      By.css('app-filters')
    ).componentInstance;

    const filter = {name: 'orderby', value: 'priority'};

    const orgName = 'org';
    const expectedRoute =
      '/' +
      RouteProvider.routes.main.link(orgName) +
      ';' +
      filter.name +
      '=' +
      filter.value;

    component.orgName = orgName;

    filterComponent.filtersChanged.emit([filter]);

    tick();

    expect(location.path()).toEqual(expectedRoute);
  }));
});
