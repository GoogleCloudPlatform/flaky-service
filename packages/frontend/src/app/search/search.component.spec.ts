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
import {of} from 'rxjs';
import {first} from 'rxjs/operators';
import {Location} from '@angular/common';
import {AppRoutingModule} from '../routing/app-routing.module';
import {RouteProvider} from '../routing/route-provider/RouteProvider';

describe('SearchComponent', () => {
  let component: SearchComponent;
  let fixture: ComponentFixture<SearchComponent>;
  let loader: HarnessLoader;
  let location: Location;
  const mockRepositories = [
    {name: 'Repo1', organization: ''},
    {name: '', organization: 'org A'},
    {name: 'aRepo', organization: 'anOrg'},
  ];

  // Mock services
  const mockSearchService = {};

  const expectOnlyTheDefaultOption = () => {
    const options = fixture.debugElement.queryAll(By.css('.repo-name'));

    // contains only 1 option
    expect(options.length).toEqual(1);

    // the only option is the default option
    const repositoryName = options[0].nativeElement.textContent;
    expect(repositoryName).toEqual(component.defaultOption.name);
  };
  const expectAllOptions = () => {
    const options = fixture.debugElement.queryAll(By.css('.repo-name'));

    // contains all options + the default option
    expect(options.length).toEqual(mockRepositories.length + 1);

    // contains the rigth repository names
    options.forEach((option, index) => {
      const repositoryName = option.nativeElement.textContent;
      const isTheDefaultOption = index === mockRepositories.length;
      expect(repositoryName).toEqual(
        isTheDefaultOption
          ? component.defaultOption.name
          : mockRepositories[index].name
      );
    });
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      providers: [{provide: SearchService, useValue: mockSearchService}],
      declarations: [SearchComponent],
      imports: [
        AppRoutingModule,
        MatAutocompleteModule,
        MatIconModule,
        ReactiveFormsModule,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SearchComponent);
    component = fixture.componentInstance;
    component.options = mockRepositories;
    fixture.autoDetectChanges(true);
    loader = TestbedHarnessEnvironment.loader(fixture);
    location = TestBed.get(Location);
    mockSearchService['quickSearch'] = () => of(mockRepositories);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.filteredOptions).toEqual([component.defaultOption]);
  });

  it('should update the options when the input value changes', done => {
    const repoName = mockRepositories[0].name;

    loader
      .getHarness(MatAutocompleteHarness)
      .then((input: MatAutocompleteHarness) => {
        component.inputControl.valueChanges.pipe(first()).subscribe(() => {
          setTimeout(async () => {
            expectAllOptions();
            done();
          }, component.debounceTime + 200);
        });

        input.enterText(repoName);
      });
  });

  it('should show the default option on focus', done => {
    loader
      .getHarness(MatAutocompleteHarness)
      .then((input: MatAutocompleteHarness) => {
        setTimeout(async () => {
          await input.focus();

          expectOnlyTheDefaultOption();
          done();
        });
      });
  });

  it('should show the default option when the input is empty', done => {
    loader
      .getHarness(MatAutocompleteHarness)
      .then((input: MatAutocompleteHarness) => {
        setTimeout(async () => {
          await input.enterText('r'); // enter a text
          await (await input.host()).clear(); // clear the input

          expectOnlyTheDefaultOption();
          done();
        });
      });
  });

  it('should show the default option when there is a space in the input', done => {
    loader
      .getHarness(MatAutocompleteHarness)
      .then((input: MatAutocompleteHarness) => {
        setTimeout(async () => {
          await input.enterText('repo ');

          expectOnlyTheDefaultOption();
          done();
        });
      });
  });

  it('should empty the input when the default option is selected', done => {
    loader
      .getHarness(MatAutocompleteHarness)
      .then((input: MatAutocompleteHarness) => {
        setTimeout(async () => {
          await input.focus();

          await input.selectOption({
            text: new RegExp(component.defaultOption.name),
          });

          expect(await input.getValue()).toEqual('');
          done();
        });
      });
  });

  it('should not update the options when the input is empty', done => {
    loader
      .getHarness(MatAutocompleteHarness)
      .then((input: MatAutocompleteHarness) => {
        setTimeout(async () => {
          // the input will be emptied the next time it's value changes
          mockSearchService['quickSearch'] = () => {
            component.inputControl.setValue('');
            return of(mockRepositories);
          };

          await input.enterText('r'); // enter a text

          expectOnlyTheDefaultOption();
          done();
        });
      });
  });

  it('should search the selected option when a repository is selected', done => {
    const repoName = mockRepositories[2].name;
    const orgName = mockRepositories[2].organization;
    component.orgName = orgName;

    loader
      .getHarness(MatAutocompleteHarness)
      .then((input: MatAutocompleteHarness) => {
        component.inputControl.valueChanges.pipe(first()).subscribe(() => {
          setTimeout(async () => {
            // select the repository
            await input.selectOption({text: new RegExp(repoName)});
            await fixture.whenStable();

            // redirected to the search page
            let expectedLocation =
              '/' + RouteProvider.routes.main.link(orgName);
            expectedLocation += ';repo=' + repoName;
            expect(location.path()).toEqual(expectedLocation);
            done();
          }, component.debounceTime + 200);
        });
        input.enterText(repoName);
      });
  });

  it('should search the repo with the entered text when the user hits `enter`', async () => {
    const repoName = mockRepositories[2].name;
    const orgName = mockRepositories[2].organization;
    component.orgName = orgName;

    const input = await loader.getHarness(MatInputHarness);

    // write the repo name
    await input.setValue(repoName);
    const inputElement = fixture.debugElement.query(By.css('input'));

    // hit enter
    inputElement.triggerEventHandler('keyup.enter', {});
    await fixture.whenStable();

    // redirected to the search page
    let expectedLocation = '/' + RouteProvider.routes.main.link(orgName);
    expectedLocation += ';repo=' + repoName;
    expect(location.path()).toEqual(expectedLocation);
  });
});
