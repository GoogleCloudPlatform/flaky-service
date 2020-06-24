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

import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';
import {COMService} from '../com/com.service';
import {Repository, Search} from './interfaces';
import {map, catchError} from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  // mock repositories until the server returns the actual data
  repositories: Repository[] = [
    {
      repoName: 'A repository',
      orgName: 'Organisation',
      description: 'A repository to track flacky tests.',
      testCount: 742,
      flaky: true,
      failing: true,
    },
    {
      repoName: 'Another repository',
      orgName: 'GCP',
      description: 'A repository to do some GCP stuff.',
      testCount: 12896,
      flaky: true,
      failing: true,
    },
    {
      repoName: 'Yet another repository',
      orgName: 'Big organisation',
      description: 'Just a repository.',
      testCount: 18,
      flaky: true,
      failing: true,
    },
    {
      repoName: 'A very flaky repo',
      orgName: 'Flaky org',
      description: 'Just a flaky repository.',
      testCount: 5,
      flaky: true,
      failing: false,
    },
    {
      repoName: 'A flaky repo',
      orgName: 'Flaky org',
      description: 'Just a flaky repository.',
      testCount: 5195,
      flaky: true,
      failing: false,
    },
    {
      repoName: 'Another flaky repo',
      orgName: 'Flaky org',
      description: 'Just another flaky repository.',
      testCount: 159,
      flaky: true,
      failing: false,
    },
    {
      repoName: 'Yet another flaky repo',
      orgName: 'Flaky org',
      description: 'Just another flaky repository.',
      testCount: 9748,
      flaky: true,
      failing: false,
    },
    {
      repoName: 'A fine repo',
      orgName: 'Not flaky org',
      description: 'A completely fine repository.',
      testCount: 4235,
      flaky: false,
      failing: false,
    },
    {
      repoName: 'Another fine repo',
      orgName: 'Not flaky org',
      description: 'Another completely fine repository.',
      testCount: 5243,
      flaky: false,
      failing: false,
    },
    {
      repoName: 'And another fine repo',
      orgName: 'Not flaky org',
      description: 'Yes, another completely fine repository.',
      testCount: 4236,
      flaky: false,
      failing: false,
    },
  ];

  constructor(private com: COMService) {}

  quickSearch(query: string): Observable<Repository[]> {
    return this.com.fetchRepositories({query: query, filters: []}).pipe(
      map(apiRepositories => {
        return apiRepositories.repoNames.map(name => ({
          repoName: name,
          orgName: '',
        }));
      }),
      catchError(() => of([]))
    );
  }

  search(search: Search): Observable<Repository[]> {
    return of(this.repositories);
  }
}
