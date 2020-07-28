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

import {PaginatedListComponent, PageData} from './paginated-list.component';
import {Filter} from '../services/search/interfaces';
import {PageEvent} from '@angular/material/paginator';
import {
  TestBed,
  async,
  ComponentFixture,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import {environment} from 'src/environments/environment';
import {MatExpansionModule} from '@angular/material/expansion';
import {AppRoutingModule} from '../routing/app-routing.module';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {Observable, of, empty, throwError} from 'rxjs';
import {COMService} from '../services/com/com.service';

// Extend to use an instance
class ImpPaginatedListComponent extends PaginatedListComponent<PageData> {
  fetchPageData(): Observable<PageData> {
    return empty();
  }
  getEmptyElement(): PageData {
    return {} as PageData;
  }
}

describe('PaginatedListComponent', () => {
  let component: ImpPaginatedListComponent;
  let fixture: ComponentFixture<ImpPaginatedListComponent>;

  const COMServiceMock = {};

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ImpPaginatedListComponent],
      providers: [{provide: COMService, useValue: COMServiceMock}],
      imports: [AppRoutingModule, MatSnackBarModule, MatExpansionModule],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ImpPaginatedListComponent);
    component = fixture.componentInstance;
    fixture.autoDetectChanges(true);
    component.paginator = {pageIndex: 0};
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('onPageSelectionChange', () => {
    it('should disable the paginator when a new page is selected', fakeAsync(() => {
      component.viewConfig.pageIndex = 0;
      // this spy prevents the finalization of the observable (allowing to 'pause' the data fetching pipeline)
      spyOn(component, 'fetchPageData').and.returnValue(({
        pipe: () => ({pipe: () => empty()}),
      } as unknown) as Observable<PageData>);

      const page = {
        pageIndex: 1,
        previousPageIndex: 0,
      } as PageEvent;

      component.onPageSelectionChange(page);

      expect(component.paginatorConfig.disable).toBeTrue();
      tick();
    }));

    it('should enable the paginator when a new page is received', fakeAsync(() => {
      const fakeRepos = {
        hasprev: false,
        hasnext: false,
        repos: [],
        elementsFieldName: 'repos',
      };
      spyOn(component, 'fetchPageData').and.returnValue(of(fakeRepos));
      const page = {
        pageIndex: 1,
        previousPageIndex: 0,
      } as PageEvent;

      component.onPageSelectionChange(page);
      tick();

      expect(component.paginatorConfig.disable).toBeFalse();
    }));

    it('should set the next page index when the next page is selected', fakeAsync(() => {
      spyOn(component, 'fetchPageData').and.returnValue(empty());
      const page = {
        pageIndex: 1,
        previousPageIndex: 0,
      } as PageEvent;

      component.onPageSelectionChange(page);
      tick();

      expect(component.viewConfig.pageIndex).toEqual(10);
    }));

    it('should set the previous page index when the previous page is selected', fakeAsync(() => {
      spyOn(component, 'fetchPageData').and.returnValue(empty());
      const page = {
        pageIndex: 0,
        previousPageIndex: 1,
      } as PageEvent;

      component.onPageSelectionChange(page);
      tick();

      expect(component.viewConfig.pageIndex).toEqual(0);
    }));

    it('should fetch the next page when the next page is selected', fakeAsync(() => {
      const fetcher = spyOn(component, 'fetchPageData').and.returnValue(
        empty()
      );
      const page = {
        pageIndex: 1,
        previousPageIndex: 0,
      } as PageEvent;

      component.onPageSelectionChange(page);
      tick();

      const expectedFilters: Filter[] = [
        {name: 'limit', value: '10'},
        {name: 'offset', value: '10'},
      ];
      expect(fetcher).toHaveBeenCalledTimes(1);
      const passedArgs = fetcher.calls.mostRecent().args as object[];
      expectedFilters.forEach(filter =>
        expect(passedArgs[0]).toContain(jasmine.objectContaining(filter))
      );
    }));

    it('should fetch the previous page when the previous page is selected', fakeAsync(() => {
      const fetcher = spyOn(component, 'fetchPageData').and.returnValue(
        empty()
      );
      const page = {
        pageIndex: 0,
        previousPageIndex: 1,
      } as PageEvent;

      component.onPageSelectionChange(page);
      tick();

      const expectedFilters: Filter[] = [
        {name: 'limit', value: '10'},
        {name: 'offset', value: '0'},
      ];
      expect(fetcher).toHaveBeenCalledTimes(1);
      const passedArgs = fetcher.calls.mostRecent().args as object[];
      expectedFilters.forEach(filter =>
        expect(passedArgs[0]).toContain(jasmine.objectContaining(filter))
      );
    }));

    it('should restore the previous index if an error occurs while fetching data', fakeAsync(() => {
      spyOn(component, 'fetchPageData').and.returnValue(throwError(''));
      component.viewConfig.pageIndex = 0;
      const page = {
        pageIndex: 1,
        previousPageIndex: 0,
      } as PageEvent;

      component.onPageSelectionChange(page);
      tick();

      expect(component.viewConfig.pageIndex).toEqual(0);
    }));
  });

  describe('update', () => {
    it('should set the parameters', () => {
      const newFilters = [{name: '', value: ''}];
      component.update(newFilters, 'repo', 'org');
      expect(component.repoName).toEqual('repo');
      expect(component.orgName).toEqual('org');
      expect(component.filters).toEqual(newFilters);
    });

    it('should update the page data with the new filters', fakeAsync(() => {
      const fetcher = spyOn(component, 'fetchPageData').and.returnValue(
        empty()
      );
      const newFilter = {name: 'newFilter', value: 'fiterValue'};

      component.update([newFilter], 'repo', 'org');
      tick();

      const expectedFilters: Filter[] = [
        {name: 'limit', value: '10'},
        {name: 'offset', value: '0'},
        newFilter,
      ];
      expect(fetcher).toHaveBeenCalledTimes(1);
      const passedArgs = fetcher.calls.mostRecent().args as object[];
      expectedFilters.forEach(filter =>
        expect(passedArgs[0]).toContain(jasmine.objectContaining(filter))
      );
    }));

    it('should activate the next page selector if there is a next page', fakeAsync(() => {
      const fakeRepos = {
        hasprev: false,
        hasnext: true,
        repos: [{}, {}],
        elementsFieldName: 'repos',
      };
      spyOn(component, 'fetchPageData').and.returnValue(of(fakeRepos));

      component.update([], '', '');
      tick();

      expect(component.paginator.pageIndex).toEqual(0);
    }));

    it('should activate the previous page selector if there is a previous page', fakeAsync(() => {
      const fakeRepos = {
        hasprev: true,
        hasnext: false,
        repos: [{}, {}],
        elementsFieldName: 'repos',
      };
      spyOn(component, 'fetchPageData').and.returnValue(of(fakeRepos));

      component.update([], '', '');
      tick();

      expect(component.paginator.pageIndex).toEqual(2);
    }));

    it('should activate all page selectors if there is a previous and a next page', fakeAsync(() => {
      const fakeRepos = {
        hasprev: true,
        hasnext: true,
        repos: [{}, {}],
        elementsFieldName: 'repos',
      };
      spyOn(component, 'fetchPageData').and.returnValue(of(fakeRepos));

      component.update([], '', '');
      tick();

      expect(component.paginator.pageIndex).toEqual(1);
    }));

    it('should hide the paginator if there is only 1 page to show', fakeAsync(() => {
      const fakeRepos = {
        hasprev: false,
        hasnext: false,
        repos: [{}, {}],
        elementsFieldName: 'repos',
      };
      spyOn(component, 'fetchPageData').and.returnValue(of(fakeRepos));

      component.update([], '', '');
      tick();

      expect(component.paginatorConfig.show).toEqual(false);
    }));

    it('should show the paginator if there are many pages to show', fakeAsync(() => {
      const fakeRepos = {
        hasprev: true,
        hasnext: false,
        repos: [{}, {}],
        elementsFieldName: 'repos',
      };
      spyOn(component, 'fetchPageData').and.returnValue(of(fakeRepos));

      component.update([], '', '');
      tick();

      expect(component.paginatorConfig.show).toEqual(true);
    }));
  });

  describe('onElementClick', () => {
    const newLocation = '/newLoc';

    beforeEach(() => {
      environment.production = true;
    });

    it("should redirect to the provided link if the source isn't an anchor element", () => {
      spyOn(component.router, 'navigateByUrl');
      const event = ({
        srcElement: document.createElement('b'),
      } as unknown) as MouseEvent;

      component.onElementClick(newLocation, event);

      expect(component.router.navigateByUrl).toHaveBeenCalledWith(newLocation);
    });

    it('should not redirect if the source is an anchor element', () => {
      spyOn(component.router, 'navigateByUrl');
      const event = ({
        srcElement: document.createElement('a'),
      } as unknown) as MouseEvent;

      component.onElementClick(newLocation, event);

      expect(component.router.navigateByUrl).not.toHaveBeenCalled();
    });

    it('should open a new window if the blank is true', () => {
      const windowOpen = spyOn(window, 'open');
      const event = ({
        srcElement: document.createElement('b'),
      } as unknown) as MouseEvent;

      component.onElementClick(newLocation, event, true);

      expect(windowOpen).toHaveBeenCalledWith(newLocation, '_blank');
    });
  });
});
