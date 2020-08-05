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
import {MatDialogModule} from '@angular/material/dialog';
import {Component, Input, Output, EventEmitter} from '@angular/core';
import {Search, Filter} from '../services/search/interfaces';
import {of, throwError} from 'rxjs';
import {MatExpansionModule} from '@angular/material/expansion';
import {AppRoutingModule} from '../routing/app-routing.module';
import {Location} from '@angular/common';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {By} from '@angular/platform-browser';
import {expectedParams} from '../services/interpretation/interpretation.service';
import {RouteProvider} from '../routing/route-provider/RouteProvider';
import {COMService} from '../services/com/com.service';
import {NotFoundError} from '../services/com/Errors/NotFoundError';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';

// Mock the inner components
const testsListViewConfig = {pageSize: 10, pageIndex: 0, elements: []};
@Component({
  selector: 'app-tests-list',
})
class TestsListComponent {
  @Input() repoName = '';
  @Input() orgName = '';
  @Output() loading = true;
  @Output() loadingComplete: EventEmitter<void> = new EventEmitter();
  viewConfig = testsListViewConfig;
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
  @Input() showDefaultOption = true;
  @Output() filtersChanged = new EventEmitter<Filter[]>();
}
@Component({
  selector: 'app-heat-map',
})
class HeatMapComponent {
  @Input() orgName = '';
  @Input() repoName = '';
}

describe('RepositoryComponent', () => {
  let component: RepositoryComponent;
  let fixture: ComponentFixture<RepositoryComponent>;
  let location: Location;

  const getFilters = () => {
    const filters = [];
    let expectedRouteParams = '';
    expectedParams
      .get(RouteProvider.routes.repo.name)
      .filters.forEach(filterName => {
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
  const mockComService = {
    fetchRepository: () => of({environments: {}}),
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      providers: [{provide: COMService, useValue: mockComService}],
      declarations: [
        RepositoryComponent,
        TestsListComponent,
        SearchComponent,
        FiltersComponent,
        HeatMapComponent,
      ],
      imports: [
        AppRoutingModule,
        MatExpansionModule,
        MatDialogModule,
        NoopAnimationsModule,
        MatProgressSpinnerModule,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RepositoryComponent);
    component = fixture.componentInstance;
    fixture.autoDetectChanges(true);
    mockComService.fetchRepository = () => of({environments: {}});
    location = TestBed.get(Location);
    component.testsListComponent = {update: () => {}};
    component.heatMap = {init: () => {}};
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

    mockComService.fetchRepository = () =>
      of({environments: getEnvironments()});

    component.ngAfterViewInit();
  });

  it('should redirect/refresh when the filters selection changes', fakeAsync(() => {
    component.onHeatMapLoaded();
    fixture.detectChanges();
    const filterComponent: FiltersComponent = fixture.debugElement.query(
      By.css('app-filters')
    ).componentInstance;

    const {filters, expectedRouteParams} = getFilters();
    const orgName = 'org',
      repoName = 'repo';
    const expectedRoute =
      '/' +
      RouteProvider.routes.repo.link(orgName, repoName) +
      expectedRouteParams;

    component.orgName = orgName;
    component.repoName = repoName;

    filterComponent.filtersChanged.emit(filters);

    tick();

    expect(location.path()).toEqual(expectedRoute);
  }));

  it('should redirect to the 404 page if no repository was found', fakeAsync(() => {
    mockComService.fetchRepository = () => throwError(new NotFoundError());

    component.ngAfterViewInit();
    tick();

    expect(location.path()).toEqual(RouteProvider.routes._404.link());
  }));

  it('should hide the spinner when tests list is ready', fakeAsync(() => {
    component.onTestsLoaded();

    component.ngAfterViewInit();
    fixture.detectChanges();
    tick();

    const spinner = fixture.debugElement.query(By.css('#spinner'));
    expect(spinner).toBeNull();
  }));

  it('should hide the spinner when the heat map is ready', fakeAsync(() => {
    component.onHeatMapLoaded();

    component.ngAfterViewInit();
    fixture.detectChanges();
    tick();

    const spinner = fixture.debugElement.query(By.css('#spinner'));
    expect(spinner).toBeNull();
  }));

  it('should show the no-test text when no tests were found', fakeAsync(() => {
    testsListViewConfig.elements = [];
    component.onTestsLoaded();

    fixture.detectChanges();
    tick();

    const noRepoText = fixture.debugElement.query(By.css('#no-tests-found'));
    expect(noRepoText).not.toBeNull();
  }));

  it('should hide the no-test text when tests were found', fakeAsync(() => {
    testsListViewConfig.elements = [{}];
    component.onTestsLoaded();

    fixture.detectChanges();
    tick();

    const noRepoText = fixture.debugElement.query(By.css('#no-repo-found'));
    expect(noRepoText).toBeNull();
  }));

  it('should hide the filters while the heat map is not ready', fakeAsync(() => {
    component.heatMapLoaded = false;

    fixture.detectChanges();
    tick();

    const filterClasses = fixture.debugElement.query(
      By.css('#filters-container')
    ).attributes['class'];
    expect(filterClasses).toContain('hidden');
  }));

  it('should show the filters when the heat map is ready', fakeAsync(() => {
    component.heatMapLoaded = true;

    fixture.detectChanges();
    tick();

    const filterClasses = fixture.debugElement.query(
      By.css('#filters-container')
    ).attributes['class'];
    expect(filterClasses).not.toContain('hidden');
  }));
});
