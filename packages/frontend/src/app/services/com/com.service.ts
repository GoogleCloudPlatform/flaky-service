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
import {Repository, Filter, Tests, ApiRepositories} from '../search/interfaces';
import {catchError} from 'rxjs/operators';
import {NotFoundError} from './Errors/NotFoundError';
import {SnackBarService} from '../snackbar/snack-bar.service';
import * as moment from 'moment';
import {BuildBatch, Build} from 'src/app/heat-map/services/interfaces';

@Injectable({
  providedIn: 'root',
})
export class COMService {
  constructor(private http: HttpClient, public snackBar: SnackBarService) {}

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

  public fetchBatches(
    repoName: string,
    orgName: string,
    filters: Filter[]
  ): Observable<BuildBatch[]> {
    filters.push({name: 'utcOffset', value: moment().utcOffset().toString()});
    return this.http
      .get<BuildBatch[]>(apiLinks.get.batches(repoName, orgName), {
        params: this.getParams(filters),
      })
      .pipe(catchError(err => this.handleError(err)));
  }

  public fetchBatch(
    repoName: string,
    orgName: string,
    timestamp: number,
    filters: Filter[]
  ): Observable<Build[]> {
    filters.push({name: 'utcOffset', value: moment().utcOffset().toString()});
    return this.http
      .get<Build[]>(apiLinks.get.batch(repoName, orgName, timestamp), {
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

  public fetchDeleteTestUrl(
    orgName: string,
    repoName: string,
    testName: string,
    redirect: string
  ): Observable<string> {
    return this.http
      .get(apiLinks.get.deleteTest(orgName, repoName, testName, redirect), {
        responseType: 'text',
      })
      .pipe(catchError(err => this.handleError(err)));
  }

  public fetchDeleteRepoUrl(
    orgName: string,
    repoName: string,
    redirect: string
  ): Observable<string> {
    return this.http
      .get(apiLinks.get.deleteRepo(orgName, repoName, redirect), {
        responseType: 'text',
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
