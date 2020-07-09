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
import {Filter, Search} from '../../services/search/interfaces';
import {SearchInterpreter} from './interpreters/search-interpreter';
import {
  RouteInterpreter,
  FoundParams,
  ExpectedParams,
} from './interpreters/route-interpreter';
export {ExpectedParams, expectedParams} from './interpreters/route-interpreter';

// This class is responsible for determining wheter a search input can be considered as a filtering option
@Injectable({
  providedIn: 'root',
})
export class InterpretationService {
  searchInterpreter: SearchInterpreter = new SearchInterpreter();
  queryInterpreter: RouteInterpreter = new RouteInterpreter();

  /*
   * Parses an entire input with possibly multiple filters.
   */
  parseSearchInput(input: string): Search {
    return this.searchInterpreter.parseSearchInput(input);
  }

  /*
   * Builds the route query parameters corresponding to the provided filters.
   */
  getRouteParam(filters: Filter[]): object {
    return this.searchInterpreter.getRouteParam(filters);
  }

  /*
   * Builds an object filled with the expected parameters if they are present.
   * @param queryParam The route query parameters object.
   * @param expectedParameters The parameters to look for.
   */
  parseRouteParam(
    queryParam: object,
    expectedParameters: ExpectedParams
  ): FoundParams {
    return this.queryInterpreter.parseRouteParam(
      queryParam,
      expectedParameters
    );
  }
}
