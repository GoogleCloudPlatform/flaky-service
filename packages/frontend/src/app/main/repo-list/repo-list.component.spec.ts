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
import {
  MatPaginatorModule,
  MatPaginator,
  PageEvent,
} from '@angular/material/paginator';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {RepoListComponent} from './repo-list.component';
import {Repository} from 'src/app/services/search/interfaces';
import {AppRoutingModule} from 'src/app/routing/app-routing.module';
import {MatDialogModule} from '@angular/material/dialog';
import {HttpClientModule} from '@angular/common/http';

describe('RepoListComponent', () => {
  let component: RepoListComponent;
  let fixture: ComponentFixture<RepoListComponent>;

  const mockRepositories: Repository[] = [
    {
      name: '',
      organization: '',
      flaky: 0,
      numfails: 0,
      numtestcases: 10,
    },
  ];

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [RepoListComponent],
      imports: [
        AppRoutingModule,
        BrowserAnimationsModule,
        MatPaginatorModule,
        HttpClientModule,
        MatDialogModule,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RepoListComponent);
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

    component.repositories = mockRepositories;

    expect(component._elements).toEqual(mockRepositories);
    // reset the index
    expect(component.pageIndex).toEqual(0);
    // didn't change the page size
    expect(component.pageSize).toEqual(expectedPageSize);
  });

  it('should not return to the first page when the paginator is not ready', () => {
    const expectedPageIndex = 1;
    component.paginator = undefined;
    component.pageIndex = expectedPageIndex;

    component.repositories = mockRepositories;

    expect(component.pageIndex).toEqual(expectedPageIndex);
  });
});
