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

import {Component, EventEmitter, OnInit, Output, NgZone} from '@angular/core';
import {FormControl} from '@angular/forms';
import {map, filter, debounceTime, switchMap} from 'rxjs/operators';
import {
  InterpretationService,
  expectedParams,
} from '../services/interpretation/interpretation.service';
import {Repository, Search} from '../services/search/interfaces';
import {SearchService} from '../services/search/search.service';
import {Router, NavigationEnd, ActivatedRoute} from '@angular/router';
import {RouteProvider} from '../routing/route-provider/RouteProvider';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css'],
})
export class SearchComponent implements OnInit {
  @Output() searchOptionSelected = new EventEmitter<Search>();

  inputControl = new FormControl();
  options: Repository[] = [];
  filteredOptions: Repository[];
  debounceTime = 200;

  orgName = '';
  showSearchBar = true;
  optionActivated = false;

  constructor(
    private searchService: SearchService,
    private interpreter: InterpretationService,
    private ngZone: NgZone,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.filteredOptions = [];
    this.setupListeners();
  }

  private setupListeners() {
    this.inputControl.valueChanges
      .pipe(
        debounceTime(this.debounceTime),
        map(value => this.updateOptions(value)),
        filter(value => this.canBeAutoCompleted(value)),
        switchMap(value => this.searchService.quickSearch(value, this.orgName))
      )
      .subscribe(newOptions => {
        if (this.inputControl.value) this.filteredOptions = newOptions;
      });
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => this.updateOrg());
  }

  /**
   * Updates the organisation name and shows/hide the search bar if an org name was found
   */
  private updateOrg() {
    const route = this.route.root.firstChild.snapshot;
    const foundParams = this.interpreter.parseRouteParam(
      route.params,
      expectedParams.get(RouteProvider.routes.main.name)
    );
    this.orgName = foundParams.queries.get(RouteProvider.routes.main.name);
    this.showSearchBar = this.orgName !== '';
  }

  /**
   * Returns a boolean indicating if a user input can be autocompleted
   * An input can be autocompleted if it exists and doesn't contain space
   * @param input The user input to be considered
   */
  private canBeAutoCompleted(input: string): boolean {
    return input && !input.toString().includes(' ');
  }

  /**
   * Hides the autocomplete options if the input is empty
   * @param input The user input to be considered
   */
  private updateOptions(input: string): string {
    if (!input || (input && input.toString().includes(' ')))
      this.filteredOptions = [];
    return input;
  }

  onEnterKeyUp(option: string) {
    if (!this.optionActivated)
      this.launchSearch(this.interpreter.parseSearchInput(option));
    this.optionActivated = false;
  }

  onSearchOptionSelected(option: string) {
    this.optionActivated = true;
    this.inputControl.setValue(option);
    this.openRepo(option);
  }

  /**
   * Redirects to the organization page with search options
   * @param option The search to perform after the redirection
   */
  launchSearch(option: Search) {
    this.ngZone.run(() => {
      option.filters.push({name: 'repo', value: option.query});
      const link = RouteProvider.routes.main.link(this.orgName);
      this.router.navigate([
        link,
        this.interpreter.getRouteParam(option.filters),
      ]);
    });
  }

  /**
   * Redirects to the repository page
   * @param repoName The repository to open
   */
  private openRepo(repoName: string) {
    this.ngZone.run(() => {
      const link = RouteProvider.routes.repo.link(this.orgName, repoName);
      this.router.navigateByUrl(link);
    });
  }
}

export interface SearchOption {
  repoName: string;
  orgName: string;
}

export interface SearchSelection {
  name: string;
  isAnOrg: boolean;
}
