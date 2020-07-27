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
import {SearchService} from './search.service';
import {COMService} from '../com/com.service';
import {ApiRepositories, Search} from './interfaces';
import {of, throwError} from 'rxjs';

describe('SearchService', () => {
  let service: SearchService;

  // Mock sub-services
  const repositories: ApiRepositories = {
    hasnext: false,
    hasprev: false,
    repos: [
      {name: 'repo1', organization: ''},
      {name: 'repo2', organization: ''},
    ],
  };
  const mockCOMService = {
    fetchRepositories: () => of(repositories),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{provide: COMService, useValue: mockCOMService}],
    });
    service = TestBed.inject(SearchService);
    mockCOMService.fetchRepositories = () => of(repositories);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('quickSearch', () => {
    it('should return the fetched repositories', done => {
      const targetRepo = 'repo',
        targetOrg = 'org';
      service.quickSearch(targetRepo, targetOrg).subscribe(repos => {
        expect(repos.length).toEqual(repositories.repos.length);

        repos.forEach((repo, index) => {
          expect(repo.name).toEqual(repositories.repos[index].name);
        });
        done();
      });
    });

    it('should return an empty response if an error occurs', done => {
      // prepare the error
      mockCOMService.fetchRepositories = () => throwError('');

      // query a normal repo
      const targetRepo = 'repo',
        targetOrg = 'org';
      service.quickSearch(targetRepo, targetOrg).subscribe(repos => {
        expect(repos.length).toEqual(0); // empty array
        done();
      });
    });
  });

  describe('search', () => {
    it('should return the fetched repositories', done => {
      const search: Search = {query: '', filters: []};

      service.search(search, 'org').subscribe(repos => {
        expect(repos.length).toEqual(repositories.repos.length);

        repos.forEach((repo, index) => {
          expect(repo.name).toEqual(repositories.repos[index].name);
        });
        done();
      });
    });

    it("should add the 'order by priority' filter to the search if itsn't already present", done => {
      const search: Search = {query: '', filters: []};
      const reposFetcher = spyOn(
        mockCOMService,
        'fetchRepositories'
      ).and.callThrough();

      service.search(search, 'org').subscribe();

      const expectedSearch: Search = {
        query: '',
        filters: [{name: 'orderby', value: 'priority'}],
      };
      const providedSearch = (reposFetcher.calls.mostRecent()
        .args as Search[])[0];
      expect(providedSearch).toEqual(jasmine.objectContaining(expectedSearch));
      done();
    });

    it("should not add the 'order by priority' filter to the search if it is already present", done => {
      const search: Search = {
        query: '',
        filters: [{name: 'orderby', value: 'name'}],
      };
      const reposFetcher = spyOn(
        mockCOMService,
        'fetchRepositories'
      ).and.callThrough();

      service.search(search, 'org').subscribe();

      const providedSearch = (reposFetcher.calls.mostRecent()
        .args as Search[])[0];
      expect(providedSearch).toEqual(jasmine.objectContaining(search));
      done();
    });
  });
});
