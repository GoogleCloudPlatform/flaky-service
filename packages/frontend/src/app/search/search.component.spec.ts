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

import {SearchComponent} from './search.component';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatIconModule} from '@angular/material/icon';
import {ReactiveFormsModule} from '@angular/forms';
import {MatAutocompleteHarness} from '@angular/material/autocomplete/testing';
import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import {HarnessLoader} from '@angular/cdk/testing';
import {MatInputHarness} from '@angular/material/input/testing';
import {By} from '@angular/platform-browser';
import {SearchService} from '../services/search/search.service';
import {InterpretationService} from './interpretation/interpretation.service';
import {of} from 'rxjs';
import {debounceTime, first} from 'rxjs/operators';

describe('SearchComponent', () => {
  let component: SearchComponent;
  let fixture: ComponentFixture<SearchComponent>;
  let loader: HarnessLoader;
  const mockRepositories = [
    {repoName: 'Repo1', orgName: ''},
    {repoName: '', orgName: 'org A'},
  ];

  // Mock services
  const mockSearchService = {quickSearch: () => of(mockRepositories)};
  const mockInterpretationService = {
    parse: input => {
      return {query: input, filters: []};
    },
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      providers: [
        {provide: SearchService, useValue: mockSearchService},
        {provide: InterpretationService, useValue: mockInterpretationService},
      ],
      declarations: [SearchComponent],
      imports: [MatAutocompleteModule, MatIconModule, ReactiveFormsModule],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SearchComponent);
    component = fixture.componentInstance;
    component.options = mockRepositories;
    fixture.autoDetectChanges(true);
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit the selected option when a repository is selected', done => {
    const emitMethod = spyOn(component.searchOptionSelected, 'emit');
    const repoName = mockRepositories[0].repoName;

    loader
      .getHarness(MatAutocompleteHarness)
      .then((input: MatAutocompleteHarness) => {
        component.inputControl.valueChanges
          .pipe(first(), debounceTime(component.debounceTime + 200))
          .subscribe(() => {
            setTimeout(async () => {
              // select the repository
              await input.selectOption({text: new RegExp(repoName)});

              expect(emitMethod.calls.mostRecent().args[0].query).toEqual(
                repoName
              );
              expect(component.searchOptionSelected.emit).toHaveBeenCalledTimes(
                1
              );
              done();
            }, component.debounceTime + 200);
          });
        input.enterText(repoName);
      });
  });

  it('should emit the entered text when the user hits `enter`', async () => {
    const input = await loader.getHarness(MatInputHarness);

    // write the repo name
    await input.setValue(mockRepositories[0].repoName);
    const inputElement = fixture.debugElement.query(By.css('input'));

    // hit enter
    const emitMethod = spyOn(component.searchOptionSelected, 'emit');
    inputElement.triggerEventHandler('keyup.enter', {});

    expect(emitMethod.calls.mostRecent().args[0].query).toEqual(
      mockRepositories[0].repoName
    );
    expect(component.searchOptionSelected.emit).toHaveBeenCalledTimes(1);
  });
});
