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
import {Component, Input} from '@angular/core';
import {Search} from '../services/search/interfaces';
import {SearchService} from '../services/search/search.service';
import {AppRoutingModule} from '../routing/app-routing.module';
import {MatDialogModule} from '@angular/material/dialog';
import {of} from 'rxjs';
import {ActivatedRoute} from '@angular/router';
import {By} from '@angular/platform-browser';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';

// Mock the inner components
@Component({
  selector: 'app-repo-list',
})
class RepoListComponent {
  @Input() repositories = [];
}

describe('MainComponent', () => {
  let component: MainComponent;
  let fixture: ComponentFixture<MainComponent>;

  // Mock services
  const mockSearchService = {repositories: [], search: () => of([])};
  const mockRoute = {params: of()};
  const orgName = 'org';

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      providers: [
        {provide: SearchService, useValue: mockSearchService},
        {provide: ActivatedRoute, useValue: mockRoute},
      ],
      declarations: [MainComponent, RepoListComponent],
      imports: [AppRoutingModule, MatDialogModule, MatProgressSpinnerModule],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MainComponent);
    component = fixture.componentInstance;
    fixture.autoDetectChanges(true);
    mockSearchService.search = () => of([]);
    mockRoute.params = of({org: orgName});
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
      const searchSpy = spyOn(mockSearchService, 'search').and.callThrough();

      component.ngOnInit();

      expect(mockSearchService.search).toHaveBeenCalled();
      const search = (searchSpy.calls.mostRecent().args as Array<
        object
      >)[0] as Search;
      expect(search.filters).toContain(
        jasmine.objectContaining({name: 'org', value: orgName})
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
});
