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

import {TestBed, fakeAsync, tick} from '@angular/core/testing';
import {SearchService} from './search.service';
import {COMService} from '../com/com.service';
import {ApiRepositories} from './interfaces';
import {of, throwError, empty} from 'rxjs';

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
      service.search('repo', 'org', []).subscribe(reponse => {
        expect(reponse.repos.length).toEqual(repositories.repos.length);

        reponse.repos.forEach((repo, index) => {
          expect(repo.name).toEqual(repositories.repos[index].name);
        });
        done();
      });
    });

    it("should add the 'order by priority' filter to the search if it isn't already present", fakeAsync(() => {
      const reposFetcher = spyOn(
        mockCOMService,
        'fetchRepositories'
      ).and.returnValue(empty());

      service.search('repo', 'org', []).subscribe();
      tick();

      expect(reposFetcher).toHaveBeenCalledTimes(1);
      const reposFetcherArgs = reposFetcher.calls.mostRecent().args as (
        | object
        | string
      )[];
      expect(reposFetcherArgs[0]).toEqual('repo');
      expect(reposFetcherArgs[1]).toEqual('org');
      expect(reposFetcherArgs[2]).toEqual([
        {name: 'orderby', value: 'priority'},
      ]);
    }));

    it("should not add the 'order by priority' filter to the search if it is already present", fakeAsync(() => {
      const reposFetcher = spyOn(
        mockCOMService,
        'fetchRepositories'
      ).and.returnValue(empty());

      const filters = [{name: 'orderby', value: 'name'}];
      service.search('repo', 'org', filters).subscribe();
      tick();

      expect(reposFetcher).toHaveBeenCalledTimes(1);
      const reposFetcherArgs = reposFetcher.calls.mostRecent().args as (
        | object
        | string
      )[];
      expect(reposFetcherArgs[0]).toEqual('repo');
      expect(reposFetcherArgs[1]).toEqual('org');
      expect(reposFetcherArgs[2]).toEqual(filters);
    }));
  });
});
