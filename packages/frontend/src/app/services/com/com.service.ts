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
import {HttpClient, HttpParams, HttpErrorResponse} from '@angular/common/http';
import {apiLinks} from './api';
import {Observable, empty, throwError} from 'rxjs';
import {
  Repository,
  ApiRepository,
  Filter,
  Tests,
  ApiRepositories,
} from '../search/interfaces';
import {catchError} from 'rxjs/operators';
import {NotFoundError} from './Errors/NotFoundError';
import {SnackBarService} from '../snackbar/snack-bar.service';

@Injectable({
  providedIn: 'root',
})
export class COMService {
  constructor(private http: HttpClient, private snackBar: SnackBarService) {}

  public fetchRepositories(
    repoName: string,
    orgName: string,
    filters: Filter[]
  ): Observable<ApiRepositories> {
    let params: HttpParams = new HttpParams().set('startswith', repoName);
    filters.forEach(filter => (params = params.set(filter.name, filter.value)));
    return this.http
      .get<ApiRepositories>(apiLinks.get.repositories(orgName), {
        params: params,
      })
      .pipe(catchError(err => this.handleError(err)));
  }

  public fetchBuilds(
    repoName: string,
    orgName: string,
    filters: Filter[]
  ): Observable<ApiRepository> {
    filters.push({name: 'limit', value: '999999'});
    return this.http
      .get<ApiRepository>(apiLinks.get.builds(repoName, orgName), {
        params: this.getParams(filters),
      })
      .pipe(catchError(err => this.handleError(err)));
  }

  public fetchTests(
    repoName: string,
    orgName: string,
    filters: Filter[]
  ): Observable<Tests> {
    return this.http
      .get<Tests>(apiLinks.get.tests(repoName, orgName), {
        params: this.getParams(filters),
      })
      .pipe(catchError(err => this.handleError(err)));
  }

  public fetchRepository(
    repoName: string,
    orgName: string,
    filters: Filter[]
  ): Observable<Repository> {
    return this.http
      .get<Repository>(apiLinks.get.repository(repoName, orgName), {
        params: this.getParams(filters),
      })
      .pipe(catchError(err => this.handleError(err)));
  }

  private getParams(filters: Filter[]) {
    let params: HttpParams = new HttpParams();
    filters.forEach(filter => (params = params.set(filter.name, filter.value)));
    return params;
  }

  handleError(err: HttpErrorResponse) {
    if (err.status === 0) this.snackBar.showConnectionError();
    else if (err.status === 404) return throwError(new NotFoundError());

    return empty();
  }
}
