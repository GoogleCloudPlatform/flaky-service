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

import {Filter} from '../../search/interfaces';
import {RouteProvider} from 'src/app/routing/route-provider/RouteProvider';

export class RouteInterpreter {
  parseRouteParam(
    param: object,
    expectedParameters: ExpectedParams
  ): FoundParams {
    const foundParams = {
      queries: new Map<string, string>(),
      filters: [],
    };

    const getParamName = expectedParamName => {
      return Object.keys(param).find(
        parameterName => parameterName === expectedParamName
      );
    };

    expectedParameters.queries.forEach(expectedParamName => {
      const paramName = getParamName(expectedParamName);
      foundParams.queries.set(
        expectedParamName,
        paramName ? param[paramName] : ''
      );
    });

    expectedParameters.filters.forEach(expectedParamName => {
      const paramName = getParamName(expectedParamName);
      if (paramName)
        foundParams.filters.push({
          name: paramName,
          value: param[paramName],
        });
    });
    return foundParams;
  }
}

export interface ExpectedParams {
  queries: string[];
  filters: string[];
}

export interface FoundParams {
  queries: Map<string, string>;
  filters: Filter[];
}

export const expectedParams: Map<string, ExpectedParams> = new Map([
  [RouteProvider.routes.main.name, {queries: ['org', 'repo'], filters: []}],
  [
    RouteProvider.routes.repo.name,
    {queries: ['org', 'repo'], filters: ['tag', 'matrix', 'ref', 'os']},
  ],
  ['build', {queries: ['org', 'repo', 'build'], filters: ['order by']}],
]);
