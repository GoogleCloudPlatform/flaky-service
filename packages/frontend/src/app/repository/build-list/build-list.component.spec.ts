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
import {BuildListComponent} from './build-list.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {
  MatPaginatorModule,
  MatPaginator,
  PageEvent,
} from '@angular/material/paginator';
import {Build} from 'src/app/services/search/interfaces';
import {AppRoutingModule} from 'src/app/routing/app-routing.module';

describe('BuildListComponent', () => {
  let component: BuildListComponent;
  let fixture: ComponentFixture<BuildListComponent>;

  const mockBuilds: Build[] = [
    {
      buildId: '146946',
      environment: {os: 'linux'},
      flaky: 1,
      timestamp: {_seconds: 1592268304},
      percentpassing: 80,
      numPass: 45,
      numfails: 0,
    },
  ];

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [BuildListComponent],
      imports: [AppRoutingModule, BrowserAnimationsModule, MatPaginatorModule],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BuildListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
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

    component.builds = mockBuilds;

    expect(component._elements).toEqual(mockBuilds);
    // reset the index
    expect(component.pageIndex).toEqual(0);
    // didn't change the page size
    expect(component.pageSize).toEqual(expectedPageSize);
  });

  it('should not return to the first page when the paginator is not ready', () => {
    const expectedPageIndex = 1;
    component.paginator = undefined;
    component.pageIndex = expectedPageIndex;

    component.builds = mockBuilds;

    expect(component.pageIndex).toEqual(expectedPageIndex);
  });
});
