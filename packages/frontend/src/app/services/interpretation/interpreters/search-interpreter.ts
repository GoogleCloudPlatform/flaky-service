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

import {Search, Filter} from '../../search/interfaces';

export class SearchInterpreter {
  filterSeparator = ':';
  inputSeparator = ' ';
  filters: PossibleFilter[] = [
    {name: 'flaky', possibleValues: ['y', 'n']},
    {name: 'orderby', possibleValues: ['name', 'flakyness']},
  ];

  private getValideFilter(
    filterName: string,
    filterValue: string
  ): Filter | undefined {
    const possibleFilter = this.filters.find(
      filter =>
        filter.name.toLowerCase() === filterName &&
        filter.possibleValues.includes(filterValue)
    );

    if (possibleFilter) return {name: possibleFilter.name};
    else return undefined;
  }

  private sanitizeFilter(inputFilter: Filter): Filter | undefined {
    inputFilter.value = inputFilter.value.trim().toLowerCase();
    inputFilter.name = inputFilter.name.trim().toLowerCase();

    if (
      this.getValideFilter(inputFilter.name, inputFilter.value) !== undefined
    ) {
      return inputFilter;
    } else {
      return undefined;
    }
  }

  private parseFilter(filterInput: string): Filter | undefined {
    const splittedInput: string[] = filterInput.split(this.filterSeparator);

    if (splittedInput.length === 2)
      return this.sanitizeFilter({
        name: splittedInput[0],
        value: splittedInput[1],
      });
    else return undefined;
  }

  parseSearchInput(input: string): Search {
    const interpretedInput = {
      filters: [],
      query: '',
    };
    const splittedInputs: string[] = input.split(this.inputSeparator);

    splittedInputs.forEach(splittedInput => {
      if (splittedInput.includes(this.filterSeparator)) {
        const filter = this.parseFilter(splittedInput);
        if (filter !== undefined) interpretedInput.filters.push(filter);
      } else if (!interpretedInput.query)
        interpretedInput.query = splittedInput;
    });
    return interpretedInput;
  }

  getRouteParam(filters: Filter[]): object {
    const queryObject = {};
    filters.forEach(filter => {
      queryObject[filter.name] = filter.value;
    });
    return queryObject;
  }
}

export interface PossibleFilter extends Filter {
  possibleValues: string[];
}
