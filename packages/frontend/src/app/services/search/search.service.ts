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
import {Repository, Filter, ApiRepositories} from './interfaces';
import {catchError, map} from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  constructor(private com: COMService) {}

  /**
   * Initites a search without any filter
   * @returns an empty array if there was an error
   */
  quickSearch(repoName: string, orgName: string): Observable<Repository[]> {
    return this.com
      .fetchRepositories(repoName, orgName, [])
      .pipe(map((repositories: ApiRepositories) => repositories.repos))
      .pipe(catchError(() => of([])));
  }

  /**
   * Initiates a complete search with filters
   */
  search(
    repoName: string,
    orgName: string,
    filters: Filter[]
  ): Observable<ApiRepositories> {
    const searchIsOrdered =
      filters.find(filter => filter.name === 'orderby') !== undefined;
    if (!searchIsOrdered) filters.push({name: 'orderby', value: 'priority'});
    return this.com.fetchRepositories(repoName, orgName, filters);
  }
}
