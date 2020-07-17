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
import {Search, Repository, Test} from '../search/interfaces';
import {of, asyncScheduler} from 'rxjs';
import {apiLinks} from './api';
import {Test} from 'mocha';

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
    const mockTest: Test[]= [
      {
        name: 'should set the new filters when a repository is found',
        flaky: true,
        passed: true,
        percentpassing: 53,
        searchindex: 0,
        lifetimepasscount: 8,
        lifetimefailcount: 7,
        lastupdate: {_seconds: 5460, _nanoseconds: 0},
        environments: {os: 'windows', ref: 'dev'},
      },{
        name: 'should redirect/refresh when the filters selection changes',
        flaky: true,
        passed: true,
        percentpassing: 66,
        searchindex: 0,
        lifetimepasscount: 8,
        lifetimefailcount: 5,
        lastupdate: {_seconds: 3790, _nanoseconds: 0},
        environments: {os: 'windows', ref: 'dev'},
      }
    ];

    it('should call the right link when sending a GET request', () => {
      httpClientSpy.get.and.returnValue(of(mockTest));

      service
        .fetchTests(repoName, orgName).subscribe();

      //called the right link
      expect(httpClientSpy.get.calls.mostRecent().args[0]).toEqual(
        apiLinks.get.tests(repoName, orgName)
      );
    });

    it('should get the test data', () => {
      httpClientSpy.get.and.returnValue(of(mockTest));

      service
        .fetchTests(repoName, orgName)
        .subscribe(result => {
          value = result.tests;
        });
        expect(value.length).toBe(2);
        expect(value.tests).toEqual(mockTest);
    })
  })
});
