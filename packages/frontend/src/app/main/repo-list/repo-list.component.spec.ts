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
import {MatPaginatorModule} from '@angular/material/paginator';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {RepoListComponent} from './repo-list.component';
import {ApiRepositories} from 'src/app/services/search/interfaces';
import {AppRoutingModule} from 'src/app/routing/app-routing.module';
import {MatDialogModule} from '@angular/material/dialog';
import {HttpClientModule} from '@angular/common/http';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {of} from 'rxjs';
import {COMService} from 'src/app/services/com/com.service';

describe('RepoListComponent', () => {
  let component: RepoListComponent;
  let fixture: ComponentFixture<RepoListComponent>;

  const mockRepositories: ApiRepositories = {
    hasnext: false,
    hasprev: false,
    repos: [
      {
        name: '',
        organization: '',
        flaky: 0,
        numfails: 0,
        numtestcases: 10,
        lastupdate: {_seconds: 0},
      },
    ],
  };

  const COMServiceMock = {
    fetchRepositories: () => of(mockRepositories),
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [RepoListComponent],
      providers: [{provide: COMService, useValue: COMServiceMock}],
      imports: [
        AppRoutingModule,
        BrowserAnimationsModule,
        MatPaginatorModule,
        HttpClientModule,
        MatDialogModule,
        MatSnackBarModule,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RepoListComponent);
    component = fixture.componentInstance;
    fixture.autoDetectChanges(true);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should update the rendered pages on input change', fakeAsync(() => {
    component.viewConfig.pageIndex = 1;
    const expectedPageSize: number = component.viewConfig.pageSize;
    COMServiceMock.fetchRepositories = () => of(mockRepositories);

    component.update([], '', '');
    tick();
    fixture.detectChanges();

    expect(component.viewConfig.elements).toEqual(mockRepositories.repos);
    // reset the index
    expect(component.viewConfig.pageIndex).toEqual(0);
    // didn't change the page size
    expect(component.viewConfig.pageSize).toEqual(expectedPageSize);
  }));
});
