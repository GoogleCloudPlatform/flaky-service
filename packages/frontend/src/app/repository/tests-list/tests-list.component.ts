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

import {Component} from '@angular/core';
import {
  PaginatedListComponent,
  PageData,
} from 'src/app/paginated-list/paginated-list.component';
import {Test, Filter} from 'src/app/services/search/interfaces';
import * as moment from 'moment';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

@Component({
  selector: 'app-tests-list',
  templateUrl: './tests-list.component.html',
  styleUrls: ['./tests-list.component.css'],
})
export class TestsListComponent extends PaginatedListComponent<Test> {
  fetchPageData(filters: Filter[] = []): Observable<PageData> {
    return this.comService
      .fetchTests(this.repoName, this.orgName, filters)
      .pipe(
        map(tests => {
          tests['elementsFieldName'] = 'tests';
          return tests as PageData;
        })
      );
  }

  getEmptyElement(): Test {
    return {
      lastupdate: {_seconds: 0},
    };
  }

  toLiteralDate(timestamp: number): string {
    return moment.unix(timestamp).fromNow();
  }

  toPercentage(percentpassing: number): string {
    return (percentpassing * 100).toFixed(2);
  }
}
