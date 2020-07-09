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

import {TestBed} from '@angular/core/testing';
import {ExpectedParams, InterpretationService} from './interpretation.service';
import {Search} from '../search/interfaces';

describe('InterpretationService', () => {
  let service: InterpretationService;
  const possiblefilters = [
    {name: 'orderby', possibleValues: ['name', 'flakyness']},
  ];

  // @param alter: if true, then wrong values will be injected in the inputs
  const getPossibleInputs = (alter: boolean): string | string[] => {
    const query = 'query';
    let inputs = alter ? [] : query;

    possiblefilters.forEach(filter => {
      filter.possibleValues.forEach(value => {
        if (alter) {
          inputs = inputs as [];
          // dirty the inputs
          inputs.push(
            query +
              filter.name +
              service.searchInterpreter.filterSeparator +
              value
          ); // no input separator
          inputs.push(
            query +
              service.searchInterpreter.inputSeparator +
              filter.name +
              value
          ); // no filter separator
          inputs.push(
            query +
              service.searchInterpreter.inputSeparator +
              filter.name +
              service.searchInterpreter.filterSeparator +
              value +
              service.searchInterpreter.filterSeparator +
              value
          ); // to many filter separators
        } else
          inputs +=
            service.searchInterpreter.inputSeparator +
            filter.name +
            service.searchInterpreter.filterSeparator +
            value;
      });
    });
    return inputs;
  };

  /*
   * returns a search object and the corresponding query object
   * @param addQuery If true, adds a query in the expected query object
   */
  const getRouteData = (addQuery?: boolean) => {
    const expectedQueryObject = addQuery ? {query: 'repo'} : {};
    const search = {query: 'repo', filters: []} as Search;
    const expectedParams = {queries: ['query'], filters: []} as ExpectedParams;

    service.searchInterpreter.filters.forEach(filter => {
      filter.possibleValues.forEach(value => {
        expectedQueryObject[filter.name] = value;

        const oldFilter = search.filters.find(
          _filter => _filter.name === filter.name
        );
        if (oldFilter) oldFilter.value = value;
        else {
          search.filters.push({name: filter.name, value: value});
          expectedParams.filters.push(filter.name);
        }
      });
    });

    return {search: search, queryObject: expectedQueryObject, expectedParams};
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InterpretationService);
    service.searchInterpreter.filters = possiblefilters;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('parseSearchInput', () => {
    it('should parse and return the right filters', () => {
      const inputs: string = getPossibleInputs(false) as string;
      const interpretedInput = service.parseSearchInput(inputs);
      const splittedInputs = inputs.split(
        service.searchInterpreter.inputSeparator
      );
      const query = splittedInputs.shift();

      expect(query).toEqual(interpretedInput.query);

      splittedInputs.forEach((input, index) => {
        const filter = interpretedInput.filters[index];
        expect(filter).not.toBeUndefined();

        const splittedInput = input.split(
          service.searchInterpreter.filterSeparator
        );
        expect(filter.name).toEqual(splittedInput[0]);
        expect(filter.value).toEqual(splittedInput[1]);
      });
    });

    it('should parse a wrongly positioned query', () => {
      const query = 'query';
      const filter1 =
        possiblefilters[0].name +
        service.searchInterpreter.filterSeparator +
        possiblefilters[0].possibleValues[0];
      const filter2 =
        possiblefilters[0].name +
        service.searchInterpreter.filterSeparator +
        possiblefilters[0].possibleValues[1];

      // query between filters
      const input: string =
        filter1 +
        service.searchInterpreter.inputSeparator +
        query +
        service.searchInterpreter.inputSeparator +
        filter2;

      const interpretedInput = service.parseSearchInput(input);

      expect(interpretedInput.query).toEqual(query);
      expect(interpretedInput.filters.length).toEqual(2);

      interpretedInput.filters.forEach((filter, index) => {
        expect(filter.name).toEqual(possiblefilters[0].name);
        expect(filter.value).toEqual(possiblefilters[0].possibleValues[index]);
      });
    });

    it('should not be case-sensitive', () => {
      const inputs: string = (getPossibleInputs(false) as string).toUpperCase(); // upper case input
      const interpretedInput = service.parseSearchInput(inputs);

      const splittedInputs = inputs.split(
        service.searchInterpreter.inputSeparator
      );
      const query = splittedInputs.shift();

      expect(query).toEqual(interpretedInput.query);

      splittedInputs.forEach((input, index) => {
        const filter = interpretedInput.filters[index];
        expect(filter).not.toBeUndefined();

        // the filters should have been lowercased
        const splittedInput = input
          .toLowerCase()
          .split(service.searchInterpreter.filterSeparator);
        expect(filter.name).toEqual(splittedInput[0]);
        expect(filter.value).toEqual(splittedInput[1]);
      });
    });

    it('should not parse wrong filters', () => {
      const wrongInputs = getPossibleInputs(true) as string[];

      wrongInputs.forEach(wrongInput => {
        const interpretedInput = service.parseSearchInput(wrongInput);
        const splittedInputs = wrongInput.split(
          service.searchInterpreter.inputSeparator
        );
        const query = splittedInputs.shift();

        if (query.includes(service.searchInterpreter.filterSeparator))
          expect(interpretedInput.query).toEqual('');
        else expect(query).toEqual(interpretedInput.query);
        expect(interpretedInput.filters.length).toEqual(0);
      });
    });

    it('should not parse an empty input', () => {
      const interpretedInput = service.parseSearchInput('');

      expect(interpretedInput.query).toEqual('');
      expect(interpretedInput.filters.length).toEqual(0);
    });
  });

  describe('parseRouteParam', () => {
    it('should parse and return the right params', () => {
      const {
        search: expectedSearch,
        queryObject,
        expectedParams,
      } = getRouteData(true);

      const foundParams = service.parseRouteParam(queryObject, expectedParams);

      expect(foundParams.queries.get('query')).toEqual(expectedSearch.query);
      expect(foundParams.filters).toEqual(expectedSearch.filters);
    });

    it('should return an empty strings for missing queries', () => {
      const {
        search: expectedSearch,
        queryObject,
        expectedParams,
      } = getRouteData(true);
      const missingQueryName = 'missing query';
      expectedParams.queries.push(missingQueryName);

      const foundParams = service.parseRouteParam(queryObject, expectedParams);

      expect(foundParams.queries.get(missingQueryName)).toEqual('');
      expect(foundParams.filters).toEqual(expectedSearch.filters);
    });

    it('should return empty strings for missing filters', () => {
      const {
        search: expectedSearch,
        queryObject,
        expectedParams,
      } = getRouteData(true);

      expectedParams.filters.push('missing filter name');

      const foundParams = service.parseRouteParam(queryObject, expectedParams);
      expect(foundParams.filters).toEqual(expectedSearch.filters);
    });
  });

  describe('getRouteParam', () => {
    it('should parse and return the right query object', () => {
      const {search, queryObject: expectedQueryObject} = getRouteData();

      const queryObject = service.getRouteParam(search.filters);

      expect(queryObject).toEqual(
        jasmine.objectContaining(expectedQueryObject)
      );
    });
  });
});
