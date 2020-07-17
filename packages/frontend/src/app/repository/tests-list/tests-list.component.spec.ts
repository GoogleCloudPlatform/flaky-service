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

import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {TestsListComponent} from './tests-list.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {
  MatPaginatorModule,
  MatPaginator,
  PageEvent,
} from '@angular/material/paginator';
import {AppRoutingModule} from 'src/app/routing/app-routing.module';
import {Component} from '@angular/core';
import {MatDialogModule} from '@angular/material/dialog';
import {By} from '@angular/platform-browser';

// Mock components
@Component({
  selector: 'app-test-details',
})
class TestDetailsComponent {}

describe('TestsListComponent', () => {
  let component: TestsListComponent;
  let fixture: ComponentFixture<TestsListComponent>;

  const mockTests = [
    {
      name: 'should update the rendered pages on input change',
      flaky: true,
      passed: false,
      percentpassing: 98,
      searchindex: 0,
      lifetimefailcount: 2,
      lifetimepasscount: 18,
      lastupdate: {_seconds: 53400, _nanoseconds: 0},
      environment: {os: 'windows', ref: 'dev'},
    },
    {
      name:
        'should not return to the first page when the paginator is not ready',
      flaky: false,
      passed: false,
      percentpassing: 92,
      searchindex: 0,
      lifetimefailcount: 1,
      lifetimepasscount: 9,
      lastupdate: {_seconds: 63400, _nanoseconds: 0},
      environment: {os: 'windows', ref: 'dev'},
    },
    {
      name: 'should set the new filters when a repository is found',
      flaky: true,
      passed: true,
      percentpassing: 53,
      searchindex: 0,
      lifetimefailcount: 10,
      lifetimepasscount: 12,
      lastupdate: {_seconds: 63400, _nanoseconds: 0},
      environment: {os: 'windows', ref: 'dev'},
    },
  ];

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TestsListComponent, TestDetailsComponent],
      imports: [
        AppRoutingModule,
        BrowserAnimationsModule,
        MatPaginatorModule,
        MatDialogModule,
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

  it('should update the rendered pages on input change', () => {
    component.pageIndex = 1;
    const expectedPageSize: number = component.pageSize;

    expect(component._elements).toEqual(mockTests);
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

  it('should open the tests details when user clicks on a test', async () => {

    await fixture.detectChanges();

    const dialogSpy = spyOn(component.dialog, 'open');
    const testDiv = fixture.debugElement.queryAll(By.css('div.test'))[0]
      .nativeElement;

    testDiv.click();

    await fixture.whenStable();

    expect(dialogSpy).toHaveBeenCalledTimes(1);
    expect(dialogSpy.calls.mostRecent().args[1]).toEqual(
      jasmine.objectContaining({data: mockTests[0]})
    );
  });
});
