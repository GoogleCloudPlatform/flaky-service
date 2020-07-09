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

import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {FiltersComponent, AvailableFilter} from './filters.component';
import {MatSelectModule} from '@angular/material/select';
import {FormsModule} from '@angular/forms';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import {HarnessLoader} from '@angular/cdk/testing';
import {MatSelectHarness} from '@angular/material/select/testing';

describe('FiltersComponent', () => {
  let component: FiltersComponent;
  let fixture: ComponentFixture<FiltersComponent>;
  let loader: HarnessLoader;

  let mockFilters: AvailableFilter[] = [];

  const setMockFilters = (filtersCount?: number) => {
    filtersCount = filtersCount ? filtersCount : 3;
    mockFilters = [];
    for (let index = 0; index < filtersCount; index++) {
      mockFilters.push({
        name: 'filter' + index,
        possibleValues: ['val1', 'val2'],
        selection: '',
      });
    }
    component._filters = mockFilters;
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [FiltersComponent],
      imports: [MatSelectModule, FormsModule, BrowserAnimationsModule],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FiltersComponent);
    component = fixture.componentInstance;
    fixture.autoDetectChanges(true);
    loader = TestbedHarnessEnvironment.loader(fixture);
    setMockFilters();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit the selected filters when the user makes a new selection', async () => {
    const emitter = spyOn(component.filtersChanged, 'emit');
    setMockFilters(1);
    const select: MatSelectHarness = await loader.getHarness(MatSelectHarness);
    const selection = mockFilters[0].possibleValues[1];

    await select.clickOptions({text: new RegExp(selection)});

    const expectedFilter = {name: component._filters[0].name, value: selection};
    expect(component.filtersChanged.emit).toHaveBeenCalledTimes(1);
    expect(emitter.calls.mostRecent().args[0]).toContain(
      jasmine.objectContaining(expectedFilter)
    );
  });

  describe('setFilters', () => {
    const getFilters = (filtersCount: number) => {
      const filters = {};
      for (let index = 0; index < filtersCount; index++) {
        filters[index.toString()] = [];
      }
      return filters;
    };

    it('should set the provided filters', () => {
      const newFilters = {ref: ['master', 'dev']};
      const expectedFilters = [
        {name: 'ref', possibleValues: newFilters['ref'], selection: ''},
      ];

      component.setFilters(newFilters);

      expect(component._filters).toEqual(
        jasmine.objectContaining(expectedFilters)
      );
    });

    it('should alphabetically sort the provided filters', () => {
      const newFilters = {c: [], b: [], a: []};
      const expectedFilters = [
        {name: 'a', possibleValues: [], selection: ''},
        {name: 'b', possibleValues: [], selection: ''},
        {name: 'c', possibleValues: [], selection: ''},
      ];

      component.setFilters(newFilters);

      expect(component._filters).toEqual(
        jasmine.objectContaining(expectedFilters)
      );
    });

    it('should limit the provided filters size', () => {
      const maxLength = 5;
      component.maxOptions = maxLength;

      // limits the filters to the max length
      component.setFilters(getFilters(maxLength * 2));

      expect(component.maxOptions).toEqual(maxLength);
      expect(component._filters.length).toEqual(maxLength);

      // no errors when filters are not above length
      component.maxOptions = maxLength;
      const newLength = maxLength - 1;

      const setFilters = () => {
        component.setFilters(getFilters(newLength));
      };

      expect(setFilters).not.toThrow();
      expect(component.maxOptions).toEqual(maxLength);
      expect(component._filters.length).toEqual(newLength);
    });

    it('should alphabetically sort the provided filters after limiting their size', () => {
      const newFilters = {c: [], b: [], a: [], f: [], d: []};
      const expectedFilters = [
        {name: 'a', possibleValues: [], selection: ''},
        {name: 'b', possibleValues: [], selection: ''},
        {name: 'c', possibleValues: [], selection: ''},
      ];
      component.maxOptions = expectedFilters.length;

      component.setFilters(newFilters);

      expect(component._filters).toEqual(
        jasmine.objectContaining(expectedFilters)
      );
    });

    it('should restore the right selections if any', () => {
      const newFilters = {
        filter1: ['val1', 'val2'],
        filter2: ['val1', 'val2'],
        filter3: ['val1', 'val2'],
      };
      const savedSelection = [
        {name: 'filter1', value: 'val1'},
        {name: 'filter3', value: 'val2'},
        {name: 'fakeFilter', value: 'val1'}, // non existing filter
      ];
      const expectedFilters = [
        {name: 'filter1', possibleValues: ['val1', 'val2'], selection: 'val1'},
        {name: 'filter2', possibleValues: ['val1', 'val2'], selection: ''},
        {name: 'filter3', possibleValues: ['val1', 'val2'], selection: 'val2'},
      ];

      component.setFilters(newFilters, savedSelection);

      expect(component._filters).toEqual(
        jasmine.objectContaining(expectedFilters)
      );
    });
  });
});
