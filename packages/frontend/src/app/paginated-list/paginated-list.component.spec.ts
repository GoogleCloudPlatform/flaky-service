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

import {PaginatedListComponent} from './paginated-list.component';
import {Repository} from '../services/search/interfaces';
import {PageEvent} from '@angular/material/paginator';
import {TestBed, async, ComponentFixture} from '@angular/core/testing';
import {environment} from 'src/environments/environment';
import {HttpClientModule} from '@angular/common/http';
import {MatDialogModule} from '@angular/material/dialog';
import {AppRoutingModule} from '../routing/app-routing.module';

// Extend to use an instance
class ImpPaginatedListComponent extends PaginatedListComponent<Repository> {}

describe('PaginatedListComponent', () => {
  let component: ImpPaginatedListComponent;
  let fixture: ComponentFixture<ImpPaginatedListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ImpPaginatedListComponent],
      imports: [AppRoutingModule, MatDialogModule, HttpClientModule],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ImpPaginatedListComponent);
    component = fixture.componentInstance;
    fixture.autoDetectChanges(true);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should update the pages on initialization', () => {
    spyOn(component, 'updatePage');

    component.ngOnInit();

    expect(component.updatePage).toHaveBeenCalledTimes(1);
    expect(component.updatePage).toHaveBeenCalledWith();
  });

  describe('updatePage', () => {
    it('should update the rendered elements with the right indexes', () => {
      const expectedPageIndex = 1;
      const expectedPageSize = component.pageSize;

      const page: PageEvent = {
        pageIndex: expectedPageIndex,
        pageSize: component.pageSize,
      } as PageEvent;

      component.updatePage(page);

      expect(component.pageIndex).toEqual(expectedPageIndex);
      // the page size has been saved
      expect(component.pageSize).toEqual(expectedPageSize);
    });

    it('should not update the rendered elements if no page was provided', () => {
      component.pageIndex = 6;
      component.pageSize = 3;

      const expectedPageIndex = component.pageIndex;
      const expectedPageSize = component.pageSize;

      component.updatePage();

      expect(component.pageIndex).toEqual(expectedPageIndex);
      expect(component.pageSize).toEqual(expectedPageSize);
    });

    it('should hide the paginator when there is only 1 page to show', () => {
      // fill with the exact page size
      component.showPaginator = true;
      component.pageSize = 5;
      component._elements = [];
      for (let index = 0; index < component.pageSize; index++) {
        component._elements.push({name: '', organization: ''});
      }

      component.updatePage();

      expect(component.showPaginator).toBeFalse();

      // fill with a smaller page size
      component.showPaginator = true;
      component.pageSize = 5;
      component._elements = [];
      for (let index = 0; index < component.pageSize; index++) {
        component._elements.push({name: '', organization: ''});
      }

      component.updatePage();

      expect(component.showPaginator).toBeFalse();
    });

    it('should show the paginator when there is more than 1 page to show', () => {
      // fill with the exact page size
      component.showPaginator = false;
      component.pageSize = 5;
      component._elements = [];
      for (let index = 0; index < component.pageSize + 1; index++) {
        component._elements.push({name: '', organization: ''});
      }

      component.updatePage();

      expect(component.showPaginator).toBeTrue();
    });
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
