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
import {Repository, Filter} from 'src/app/services/search/interfaces';
import {
  PaginatedListComponent,
  PageData,
} from 'src/app/paginated-list/paginated-list.component';
import * as moment from 'moment';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

@Component({
  selector: 'app-repo-list',
  templateUrl: './repo-list.component.html',
  styleUrls: ['./repo-list.component.css'],
})
export class RepoListComponent extends PaginatedListComponent<Repository> {
  fetchPageData(filters: Filter[] = []): Observable<PageData> {
    return this.searchService.search(this.repoName, this.orgName, filters).pipe(
      map(repositories => {
        repositories['elementsFieldName'] = 'repos';
        return repositories as PageData;
      })
    );
  }

  getEmptyElement(): Repository {
    return {
      name: '',
      organization: '',
      lastupdate: {_seconds: 0},
    };
  }

  getLastUpdate(repo: Repository): string {
    return moment.unix(repo.lastupdate._seconds).format('MMM D, YYYY');
  }
}
