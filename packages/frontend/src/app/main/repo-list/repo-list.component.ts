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

import {Component, OnInit, Input, ViewChild} from '@angular/core';
import {PageEvent, MatPaginator} from '@angular/material/paginator';
import {Repository} from 'src/app/services/search/interfaces';

@Component({
  selector: 'app-repo-list',
  templateUrl: './repo-list.component.html',
  styleUrls: ['./repo-list.component.css'],
})
export class RepoListComponent implements OnInit {
  @ViewChild('paginator') paginator: MatPaginator;

  _repositories: Repository[] = [];
  @Input() set repositories(value: Repository[]) {
    this._repositories = value;
    this.updatePage();
    this.paginator?.firstPage();
  }

  renderedRepositories: Repository[] = [];
  pageIndex = 0;
  pageSize = 10;

  ngOnInit(): void {
    this.updatePage();
  }

  updatePage(page?: PageEvent): void {
    const startIndex: number = page
      ? page.pageIndex * page.pageSize
      : this.pageIndex * this.pageSize;
    const endIndex: number =
      startIndex + (page ? page.pageSize : this.pageSize);

    if (page) {
      this.pageIndex = page.pageIndex;
      this.pageSize = page.pageSize;
    }
    this.renderedRepositories = this._repositories.slice(startIndex, endIndex);
  }
}
