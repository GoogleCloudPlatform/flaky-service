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
import {TestsListComponent} from './tests-list.component';
import {MatExpansionModule} from '@angular/material/expansion';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {
  MatPaginatorModule,
  MatPaginator,
  PageEvent,
} from '@angular/material/paginator';
import {AppRoutingModule} from 'src/app/routing/app-routing.module';
import {Component, Input} from '@angular/core';
import {By} from '@angular/platform-browser';
import {COMService} from 'src/app/services/com/com.service';
import {mockTests} from './mockTests.spec';
import {of} from 'rxjs';
import {Test} from 'src/app/services/search/interfaces';
// Mock components
@Component({
  selector: 'app-test-details',
})
class TestDetailsComponent {
  @Input() test: Test;
}

const COMServiceMock = {
  fetchTests: () => of(mockTests),
};

describe('TestsListComponent', () => {
  let component: TestsListComponent;
  let fixture: ComponentFixture<TestsListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TestsListComponent, TestDetailsComponent],
      providers: [{provide: COMService, useValue: COMServiceMock}],
      imports: [
        AppRoutingModule,
        BrowserAnimationsModule,
        MatPaginatorModule,
        MatExpansionModule,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestsListComponent);
    component = fixture.componentInstance;
    fixture.autoDetectChanges(true);
    component.paginator = {
      firstPage: () => {
        component.updatePage({
          pageIndex: 0,
          pageSize: component.pageSize,
        } as PageEvent);
      },
    } as MatPaginator;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should update the page with test data', done => {
    COMServiceMock.fetchTests = () => of(mockTests);
    component.ngOnInit();

    const getTests = fixture.debugElement.queryAll(By.css('.test'));

    setTimeout(() => {
      expect(getTests.length).toEqual(3);
      expect(
        getTests[0].query(By.css('.test-name')).nativeElement.textContent
      ).toEqual(mockTests.tests[0].name);
      expect(
        getTests[1].query(By.css('.test-name')).nativeElement.textContent
      ).toEqual(mockTests.tests[1].name);
      expect(
        getTests[2].query(By.css('.test-name')).nativeElement.textContent
      ).toEqual(mockTests.tests[2].name);
      done();
    });
  });

  it('should update the rendered pages on input change', () => {
    component.pageIndex = 1;
    const expectedPageSize: number = component.pageSize;
    COMServiceMock.fetchTests = () => of(mockTests);
    component.ngOnInit();

    expect(component._elements).toEqual(mockTests.tests);
    // reset the index
    expect(component.pageIndex).toEqual(0);
    // didn't change the page size
    expect(component.pageSize).toEqual(expectedPageSize);
  });

  it('should not return to the first page when the paginator is not ready', () => {
    const expectedPageIndex = 1;
    component.paginator = undefined;
    component.pageIndex = expectedPageIndex;

    expect(component.pageIndex).toEqual(expectedPageIndex);
  });

  it('should expand the tests details when user clicks on a test', fakeAsync(() => {
    COMServiceMock.fetchTests = () => of(mockTests);
    component.ngOnInit();

    fixture.detectChanges();

    const panel = fixture.nativeElement.querySelector(
      'mat-expansion-panel-header'
    );
    panel.click();
    tick();
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.test-details'))).not.toBeNull();
  }));
});
