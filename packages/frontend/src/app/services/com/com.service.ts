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
import {HttpClient, HttpParams} from '@angular/common/http';
import {apiLinks} from './api';
import {Observable} from 'rxjs';
import {Search, Repository} from '../search/interfaces';

@Injectable({
  providedIn: 'root',
})
export class COMService {
  constructor(private http: HttpClient) {}

  public fetchRepositories(search: Search): Observable<Repository[]> {
    const params: HttpParams = new HttpParams().set('startswith', search.query);
    search.filters.forEach(filter => params.set(filter.name, filter.value));
    return this.http.get<Repository[]>(apiLinks.get.repositories, {
      params: params,
    });
  }
}
