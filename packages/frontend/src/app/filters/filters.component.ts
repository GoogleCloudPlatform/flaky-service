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

import {Component, Input, Output, EventEmitter} from '@angular/core';
import {Filter} from '../services/search/interfaces';
import {UtilsService} from '../services/utils.service';

@Component({
  selector: 'app-filters',
  templateUrl: './filters.component.html',
  styleUrls: ['./filters.component.css'],
})
export class FiltersComponent {
  _filters: AvailableFilter[] = [];
  @Input() showDefaultOption = true;
  @Input() maxOptions = 3;
  @Output() filtersChanged = new EventEmitter<Filter[]>();

  @Input() set filters(filtersObj: object) {
    this.setFilters(filtersObj);
  }

  constructor(private utils: UtilsService) {}

  setFilters(filtersObj: object, savedSelection?: Filter[]) {
    this._filters = this.getFilters(filtersObj);
    this.sortFilters();
    this.resizeFilters();
    this.restoreSavedSelection(savedSelection);
  }

  private restoreSavedSelection(savedFilters?: Filter[]) {
    savedFilters?.forEach(savedFilter => {
      const availableFilter = this._filters.find(
        filter => filter.name === savedFilter.name
      );
      if (availableFilter) availableFilter.selection = savedFilter.value;
    });
  }

  private resizeFilters() {
    this._filters = this._filters.slice(0, this.maxOptions);
  }

  private sortFilters() {
    this._filters.sort((filterA, filterB) =>
      filterA.name.localeCompare(filterB.name)
    );
  }

  private getFilters(filtersObject: object): AvailableFilter[] {
    const filters: AvailableFilter[] = [];
    Object.keys(filtersObject).forEach(filterName => {
      filters.push({
        name: filterName,
        possibleValues: this.getPossibleValues(filtersObject[filterName]),
        selection: '',
      });
    });
    return filters;
  }

  private getPossibleValues(providedOptions: string[] | Option[]): Option[] {
    const options: Option[] = [];

    providedOptions.forEach(option => {
      if (typeof option === 'string') {
        if (this.utils.isPureJson(option)) this.tryParseOption(option, options);
        else options.push({value: option, visibleValue: option});
      } else {
        options.push({
          value: option['value'],
          visibleValue: option['visibleValue'],
        });
      }
    });
    return options;
  }

  private tryParseOption(option: string, options: Option[]): void {
    const optionObj = JSON.parse(option);
    const optionKeys = Object.keys(optionObj);

    if (optionKeys.length) {
      const key = optionKeys[0];
      const value = optionObj[key];

      options.push({
        value: option,
        visibleValue: key + ' ' + value,
      });
    }
  }

  onSelectionChanged() {
    const filters: Filter[] = [];
    this._filters.forEach(filter => {
      if (filter.selection)
        filters.push({name: filter.name, value: filter.selection});
    });
    this.filtersChanged.emit(filters);
  }
}

export interface AvailableFilter {
  name: string;
  possibleValues: Option[];
  selection: string;
}

interface Option {
  value: string;
  visibleValue: string;
}
