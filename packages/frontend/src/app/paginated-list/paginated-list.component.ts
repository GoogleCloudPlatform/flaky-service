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

import {Component, EventEmitter, Output, ViewChild} from '@angular/core';
import {PageEvent, MatPaginator} from '@angular/material/paginator';
import {DomSanitizer} from '@angular/platform-browser';
import {Router} from '@angular/router';
import {UtilsService} from '../services/utils.service';
import {Location} from '@angular/common';
import {COMService} from '../services/com/com.service';
import {RouteProvider} from '../routing/route-provider/RouteProvider';
import {Filter} from '../services/search/interfaces';
import {Observable, empty} from 'rxjs';
import {SearchService} from '../services/search/search.service';
import {finalize, catchError} from 'rxjs/operators';
export {MatPaginator} from '@angular/material/paginator';

@Component({template: ''})
export abstract class PaginatedListComponent<Elements> {
  routes = RouteProvider.routes;
  viewConfig: ViewConfig<Elements> = {
    pageSize: 10, // limit
    pageIndex: 0, // offset
    elements: [],
  };

  paginatorConfig: PaginatorConfig<Elements> = {
    show: false,
    disable: false,
    pageSize: 1,
    elements: new Array<Elements>(3).fill(this.getEmptyElement()),
  };

  @Output() loadingComplete: EventEmitter<void> = new EventEmitter();
  @Output() loading = true;

  repoName = '';
  orgName = '';
  filters: Filter[] = [];
  removalButtonsState = {disabled: false};

  @ViewChild(MatPaginator) paginator;

  /**
   * @returns the new page data to be displayed
   */
  abstract fetchPageData(filters: Filter[]): Observable<PageData>;

  abstract getEmptyElement(): Elements;

  constructor(
    public sanitizer: DomSanitizer,
    public router: Router,
    public comService: COMService,
    public utils: UtilsService,
    public location: Location,
    public searchService: SearchService
  ) {}

  update(filters: Filter[], repoName, orgName) {
    this.repoName = repoName;
    this.orgName = orgName;
    this.filters = filters;
    this.launchDataUpdate();
  }

  private launchDataUpdate(offset?: number): void {
    const prevIndex = this.viewConfig.pageIndex;
    this.viewConfig.pageIndex = offset ? offset : 0;
    if (offset) this.paginatorConfig.disable = true;

    const filters: Filter[] = [
      {name: 'offset', value: this.viewConfig.pageIndex.toString()},
      {name: 'limit', value: this.viewConfig.pageSize.toString()},
    ];

    this.fetchPageData(filters.concat(this.filters))
      .pipe(
        finalize(() => {
          this.loading = false;
          this.paginatorConfig.disable = false;
          this.loadingComplete.emit();
        })
      )
      .pipe(
        catchError(() => {
          this.viewConfig.pageIndex = prevIndex;
          return empty();
        })
      )
      .subscribe(pageData => this.updatePage(pageData));
  }

  onPageSelectionChange(page: PageEvent): void {
    const nextPageSelected = page.pageIndex > page.previousPageIndex;
    const offsetSize = this.viewConfig.pageSize;
    let offset =
      this.viewConfig.pageIndex + (nextPageSelected ? offsetSize : -offsetSize);
    offset = offset < 0 ? 0 : offset;

    this.launchDataUpdate(offset);
  }

  private updatePage(pageData: PageData): void {
    this.viewConfig.elements = pageData[pageData.elementsFieldName];
    this.updatePaginator(pageData.hasprev, pageData.hasnext);
  }

  private updatePaginator(hasprev: boolean, hasnext: boolean) {
    if (hasnext && hasprev) this.paginator.pageIndex = 1;
    else if (hasnext) this.paginator.pageIndex = 0;
    else if (hasprev) this.paginator.pageIndex = 2;
    this.paginatorConfig.show = hasnext || hasprev;
  }

  onElementClick(link: string, event: MouseEvent, blank?: boolean) {
    const clickedOnALink = event.srcElement instanceof HTMLAnchorElement;
    if (!clickedOnALink) {
      if (blank) window.open(link, '_blank');
      else this.router.navigateByUrl(link);
    }
  }
}

interface PaginatorConfig<Elements> {
  readonly pageSize: number;
  readonly elements: Elements[];
  show: boolean;
  disable: boolean;
}

interface ViewConfig<Elements> {
  readonly pageSize: number;
  pageIndex: number;
  elements: Elements[];
}

export interface PageData {
  readonly hasnext: boolean;
  readonly hasprev: boolean;
  elementsFieldName?: string;
}
