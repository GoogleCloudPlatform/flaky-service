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

describe('SearchComponent', () => {
  let component: SearchComponent;
  let fixture: ComponentFixture<SearchComponent>;
  let loader: HarnessLoader;
  const mockRepositories = [
    {repoName: 'Repo 1', orgName: ''},
    {repoName: '', orgName: 'org A'},
  ];

  beforeEach(async(() => {
    TestBed.configureTestingModule({
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

  it('should emit the selected option when a repository is selected', async () => {
    const input = await loader.getHarness(MatAutocompleteHarness);

    await input.focus();

    // select the repository
    spyOn(component.searchOptionSelected, 'emit');
    await input.selectOption({text: new RegExp(mockRepositories[0].repoName)});

    expect(component.searchOptionSelected.emit).toHaveBeenCalledWith(
      mockRepositories[0].repoName
    );
  });

  it('should emit the selected option when an organisation is selected', async () => {
    const input = await loader.getHarness(MatAutocompleteHarness);

    await input.focus();

    // select the organisation
    spyOn(component.searchOptionSelected, 'emit');
    await input.selectOption({text: new RegExp(mockRepositories[1].orgName)});

    expect(component.searchOptionSelected.emit).toHaveBeenCalledWith(
      mockRepositories[1].orgName
    );
  });

  it('should emit the entered text when the user hits `enter`', async () => {
    const input = await loader.getHarness(MatInputHarness);

    // write the repo name
    await input.setValue(mockRepositories[0].repoName);
    const inputElement = fixture.debugElement.query(By.css('input'));

    // hit enter
    spyOn(component.searchOptionSelected, 'emit');
    inputElement.triggerEventHandler('keyup.enter', {});

    expect(component.searchOptionSelected.emit).toHaveBeenCalledWith(
      mockRepositories[0].repoName
    );
  });

  it('should not emit an empty value', async () => {
    // hit enter
    spyOn(component.searchOptionSelected, 'emit');
    const inputElement = fixture.debugElement.query(By.css('input'));
    inputElement.triggerEventHandler('keyup.enter', {});

    expect(component.searchOptionSelected.emit).not.toHaveBeenCalled();
  });
});
