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

    let queryParams: HttpParams = new HttpParams().set(
      'startswith',
      search.query
    );
    search.filters.forEach(
      filter => (queryParams = queryParams.set(filter.name, filter.value))
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

  describe('fetchBuilds', () => {
    it('should send a GET request with the provided filters', () => {
      const searchData = getSearchData();
      const repoName = 'repoName';
      const orgName = 'orgName';
      httpClientSpy.get.and.returnValue(of(searchData.expectedServerResponse));

      service
        .fetchBuilds(repoName, orgName, searchData.search.filters)
        .subscribe();

      // called the right link
      expect(httpClientSpy.get.calls.mostRecent().args[0]).toEqual(
        apiLinks.get.builds(repoName, orgName)
      );
    });
  });

  describe('fetchTests', () => {
    const repoName = 'repoName';
    const orgName = 'orgName';
    const mockTests = {
      tests: [
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
      ],
    };

    it('should get the test data and call the right link', () => {
      httpClientSpy.get.and.returnValue(of(mockTests));

      service.fetchTests(repoName, orgName).subscribe(result => {
        expect(result.tests.length).toBe(3);
        expect(result.tests).toEqual(mockTests.tests);
      });

      //called the right link
      expect(httpClientSpy.get.calls.mostRecent().args[0]).toEqual(
        apiLinks.get.tests(repoName, orgName)
      );
    });
  });
});
