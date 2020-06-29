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

import {TestBed} from '@angular/core/testing';
import {COMService} from './com.service';
import {HttpClientModule} from '@angular/common/http';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Search, Repository} from '../search/interfaces';
import {of} from 'rxjs';
import {apiLinks} from './api';

describe('COMService', () => {
  let service: COMService;
  let httpClientSpy: {get: jasmine.Spy};

  const getSearchData = () => {
    const search: Search = {
      query: 'repo',
      filters: [
        {name: 'flaky', value: 'y'},
        {name: 'orderby', value: 'name'},
      ],
    };

    const queryParams: HttpParams = new HttpParams().set(
      'startswith',
      search.query
    );
    search.filters.forEach(filter =>
      queryParams.set(filter.name, filter.value)
    );

    const serverResponse: Repository[] = [
      {name: 'repo1', organization: ''},
      {name: 'repo2', organization: ''},
    ];
    return {
      search: search,
      queryParams: {params: queryParams},
      expectedServerResponse: serverResponse,
    };
  };

  beforeEach(() => {
    httpClientSpy = {get: jasmine.createSpy()};
    TestBed.configureTestingModule({
      providers: [{provide: HttpClient, useValue: httpClientSpy}],
      imports: [HttpClientModule],
    });
    service = TestBed.inject(COMService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('fetchRepositories', () => {
    it('should send a GET request with the provided filters', () => {
      const searchData = getSearchData();
      httpClientSpy.get.and.returnValue(of(searchData.expectedServerResponse));

      service.fetchRepositories(searchData.search).subscribe(response => {
        // received the right response
        expect(response).toEqual(searchData.expectedServerResponse);
      });

      // called the right link
      expect(httpClientSpy.get.calls.mostRecent().args[0]).toEqual(
        apiLinks.get.repositories
      );

      // sent the right filters
      expect(httpClientSpy.get.calls.mostRecent().args[1]).toEqual(
        jasmine.objectContaining(searchData.queryParams)
      );
    });
  });
});
