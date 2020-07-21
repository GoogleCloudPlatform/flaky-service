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

import {Component, ViewChild, Input} from '@angular/core';
import {
  PaginatedListComponent,
  MatPaginator,
} from 'src/app/paginated-list/paginated-list.component';
import {Test} from 'src/app/services/search/interfaces';
import * as moment from 'moment';
import {TestDetailsComponent} from './test-details/test-details.component';

@Component({
  selector: 'app-tests-list',
  templateUrl: './tests-list.component.html',
  styleUrls: ['./tests-list.component.css'],
})
export class TestsListComponent extends PaginatedListComponent<Test> {
  @ViewChild('paginator') paginator: MatPaginator;

  @Input() repoName: string;
  @Input() orgName: string;

  ngOnInit() {
    super.ngOnInit();
    this.comService
      .fetchTests(this.repoName, this.orgName)
      .subscribe(result => {
        this._elements = result.tests;
        this.updatePage();
        this.paginator?.firstPage();
      });
  }

  onTestClick(test: Test) {
    this.dialog.open<TestDetailsComponent>(TestDetailsComponent, {
      data: test,
    });
  }

  toLiteralDate(timestamp: number) {
    return moment.unix(timestamp).fromNow();
  }

  toPercentage(percentpassing: number) {
    return (percentpassing * 100).toFixed(2);
  }
}
