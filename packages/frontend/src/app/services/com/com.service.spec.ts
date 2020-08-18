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

import {TestBed, tick, fakeAsync} from '@angular/core/testing';
import {COMService} from './com.service';
import {HttpClientModule, HttpErrorResponse} from '@angular/common/http';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Search, ApiRepositories} from '../search/interfaces';
import {of, empty, throwError} from 'rxjs';
import {apiLinks} from './api';
import {SnackBarService} from '../snackbar/snack-bar.service';
import {catchError, finalize} from 'rxjs/operators';
import {NotFoundError} from './Errors/NotFoundError';

describe('COMService', () => {
  let service: COMService;
  let httpClientSpy: {get: jasmine.Spy};

  const mockSnackBarService = {
    showConnectionError: () => {},
  };

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

    const serverResponse: ApiRepositories = {
      hasnext: false,
      hasprev: false,
      repos: [
        {name: 'repo1', organization: ''},
        {name: 'repo2', organization: ''},
      ],
    };
    return {
      search: search,
      queryParams: {params: queryParams},
      expectedServerResponse: serverResponse,
    };
  };

  beforeEach(() => {
    httpClientSpy = {get: jasmine.createSpy()};
    TestBed.configureTestingModule({
      providers: [
        {provide: HttpClient, useValue: httpClientSpy},
        {provide: SnackBarService, useValue: mockSnackBarService},
      ],
      imports: [HttpClientModule],
    });
    service = TestBed.inject(COMService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('fetchRepositories', () => {
    const orgName = 'org';
    it('should send a GET request with the provided filters', () => {
      const searchData = getSearchData();
      httpClientSpy.get.and.returnValue(of(searchData.expectedServerResponse));

      service
        .fetchRepositories(
          searchData.search.query,
          orgName,
          searchData.search.filters
        )
        .subscribe(response => {
          // received the right response
          expect(response).toEqual(searchData.expectedServerResponse);
        });

      // called the right link
      expect(httpClientSpy.get.calls.mostRecent().args[0]).toEqual(
        apiLinks.get.repositories(orgName)
      );

      // sent the right filters
      expect(httpClientSpy.get.calls.mostRecent().args[1]).toEqual(
        jasmine.objectContaining(searchData.queryParams)
      );
    });

    it('should call the error handler if an error occurs', () => {
      const errorHandler = spyOn(service, 'handleError').and.returnValue(
        empty()
      );
      const err = {} as HttpErrorResponse;
      httpClientSpy.get.and.returnValue(throwError(err));

      service.fetchRepositories('', 'org', []).subscribe();
      expect(errorHandler).toHaveBeenCalledWith(err);
    });
  });

  describe('fetchBatches', () => {
    it('should send a GET request with the provided filters', () => {
      const searchData = getSearchData();
      const repoName = 'repoName';
      const orgName = 'orgName';
      httpClientSpy.get.and.returnValue(of(searchData.expectedServerResponse));

      service
        .fetchBatches(repoName, orgName, searchData.search.filters)
        .subscribe();

      // called the right link
      expect(httpClientSpy.get.calls.mostRecent().args[0]).toEqual(
        apiLinks.get.batches(repoName, orgName)
      );
    });

    it('should call the error handler if an error occurs', () => {
      const errorHandler = spyOn(service, 'handleError').and.returnValue(
        empty()
      );
      const err = {} as HttpErrorResponse;
      httpClientSpy.get.and.returnValue(throwError(err));

      service.fetchBatches('repo', 'org', []).subscribe();
      expect(errorHandler).toHaveBeenCalledWith(err);
    });
  });

  describe('fetchBatch', () => {
    const timestamp = 1;
    it('should send a GET request with the provided filters', () => {
      const searchData = getSearchData();
      const repoName = 'repoName';
      const orgName = 'orgName';
      httpClientSpy.get.and.returnValue(of(searchData.expectedServerResponse));

      service
        .fetchBatch(repoName, orgName, timestamp, searchData.search.filters)
        .subscribe();

      // called the right link
      expect(httpClientSpy.get.calls.mostRecent().args[0]).toEqual(
        apiLinks.get.batch(repoName, orgName, timestamp)
      );
    });

    it('should call the error handler if an error occurs', () => {
      const errorHandler = spyOn(service, 'handleError').and.returnValue(
        empty()
      );
      const err = {} as HttpErrorResponse;
      httpClientSpy.get.and.returnValue(throwError(err));

      service.fetchBatch('repo', 'org', timestamp, []).subscribe();
      expect(errorHandler).toHaveBeenCalledWith(err);
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

      service.fetchTests(repoName, orgName, []).subscribe(result => {
        expect(result.tests.length).toBe(3);
        expect(result.tests).toEqual(mockTests.tests);
      });

      //called the right link
      expect(httpClientSpy.get.calls.mostRecent().args[0]).toEqual(
        apiLinks.get.tests(repoName, orgName)
      );
    });

    it('should call the error handler if an error occurs', () => {
      const errorHandler = spyOn(service, 'handleError').and.returnValue(
        empty()
      );
      const err = {} as HttpErrorResponse;
      httpClientSpy.get.and.returnValue(throwError(err));

      service.fetchTests('repo', 'org', []).subscribe();
      expect(errorHandler).toHaveBeenCalledWith(err);
    });
  });

  describe('fetchDeleteTestUrl', () => {
    const repoName = 'repoName';
    const orgName = 'orgName';
    const testName = 'testName';
    const redirect = 'redirect';

    it('should get a link from the server', () => {
      const serverUrl = 'url-from-server';
      httpClientSpy.get.and.returnValue(of(serverUrl));

      service
        .fetchDeleteTestUrl(orgName, repoName, testName, redirect)
        .subscribe(result => {
          expect(result).toBe(serverUrl);
        });

      //called the right link
      expect(httpClientSpy.get.calls.mostRecent().args[0]).toEqual(
        apiLinks.get.deleteTest(orgName, repoName, testName, redirect)
      );
    });

    it('should call the error handler if an error occurs', fakeAsync(() => {
      const errorHandler = spyOn(service, 'handleError').and.returnValue(
        empty()
      );
      const err = {} as HttpErrorResponse;
      httpClientSpy.get.and.returnValue(throwError(err));

      service
        .fetchDeleteTestUrl(repoName, orgName, testName, redirect)
        .subscribe();

      tick();
      expect(errorHandler).toHaveBeenCalledWith(err);
    }));
  });

  describe('fetchDeleteRepoUrl', () => {
    const repoName = 'repoName';
    const orgName = 'orgName';
    const redirect = 'redirect';

    it('should get a link from the server', () => {
      const serverUrl = 'url-from-server';
      httpClientSpy.get.and.returnValue(of(serverUrl));

      service
        .fetchDeleteRepoUrl(orgName, repoName, redirect)
        .subscribe(result => {
          expect(result).toBe(serverUrl);
        });

      //called the right link
      expect(httpClientSpy.get.calls.mostRecent().args[0]).toEqual(
        apiLinks.get.deleteRepo(orgName, repoName, redirect)
      );
    });

    it('should call the error handler if an error occurs', fakeAsync(() => {
      const errorHandler = spyOn(service, 'handleError').and.returnValue(
        empty()
      );
      const err = {} as HttpErrorResponse;
      httpClientSpy.get.and.returnValue(throwError(err));

      service.fetchDeleteRepoUrl(repoName, orgName, redirect).subscribe();

      tick();
      expect(errorHandler).toHaveBeenCalledWith(err);
    }));
  });

  describe('handleError', () => {
    it('should show the connection error message if an unknown error occurs', () => {
      spyOn(mockSnackBarService, 'showConnectionError').and.callThrough();

      service.handleError({status: 0} as HttpErrorResponse);

      expect(mockSnackBarService.showConnectionError).toHaveBeenCalled();
    });

    it('should return a NotFound error if a 404 error occurs', done => {
      spyOn(mockSnackBarService, 'showConnectionError').and.callThrough();

      service
        .handleError({status: 404} as HttpErrorResponse)
        .pipe(finalize(() => done()))
        .pipe(
          catchError(err => {
            expect(err).toBeInstanceOf(NotFoundError);
            return empty();
          })
        )
        .subscribe(() => fail());
    });
  });
});
