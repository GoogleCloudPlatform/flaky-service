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

import {Component, OnInit} from '@angular/core';
import {PageEvent} from '@angular/material/paginator';
import {DomSanitizer} from '@angular/platform-browser';
import {Router} from '@angular/router';
import {UtilsService} from '../services/utils.service';
import {MatDialog} from '@angular/material/dialog';
export {MatPaginator} from '@angular/material/paginator';

@Component({template: ''})
export class PaginatedListComponent<Elements> implements OnInit {
  _elements: Elements[] = [];
  renderedElements: Elements[] = [];
  pageIndex = 0;
  pageSize = 10;

  constructor(
    public sanitizer: DomSanitizer,
    public router: Router,
    public utils: UtilsService,
    public dialog: MatDialog
  ) {}

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
    this.renderedElements = this._elements.slice(startIndex, endIndex);
  }

  onElementClick(link: string, event: MouseEvent) {
    const clickedOnALink = event.srcElement instanceof HTMLAnchorElement;
    if (!clickedOnALink) this.router.navigateByUrl(link);
  }
}
