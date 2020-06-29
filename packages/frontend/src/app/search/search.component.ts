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

import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {FormControl} from '@angular/forms';
import {map, filter, debounceTime, switchMap} from 'rxjs/operators';
import {InterpretationService} from '../services/interpretation/interpretation.service';
import {
  DefaultRepository,
  Repository,
  Search,
} from '../services/search/interfaces';
import {SearchService} from '../services/search/search.service';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css'],
})
export class SearchComponent implements OnInit {
  @Output() searchOptionSelected = new EventEmitter<Search>();

  inputControl = new FormControl();
  options: Repository[] = [];
  defaultOption: DefaultRepository = {
    name: 'See all repositories',
    organization: '',
  };
  filteredOptions: Repository[];
  debounceTime = 200;

  constructor(
    private searchService: SearchService,
    private interpreter: InterpretationService
  ) {}

  ngOnInit(): void {
    this.filteredOptions = [this.defaultOption];
    this.inputControl.valueChanges
      .pipe(
        debounceTime(this.debounceTime),
        map(value => this.updateOptions(value)),
        filter(value => this.canBeAutoCompleted(value)),
        switchMap(value => this.searchService.quickSearch(value))
      )
      .subscribe(newOptions => {
        if (this.inputControl.value)
          this.filteredOptions = newOptions.concat([this.defaultOption]);
      });
  }

  private canBeAutoCompleted(input: string): boolean {
    return input && !input.toString().includes(' ');
  }

  private updateOptions(value: string): string {
    if (!value || (value && value.toString().includes(' ')))
      this.filteredOptions = [this.defaultOption];
    return value;
  }

  onEnterKeyUp(option: string): void {
    this.searchOptionSelected.emit(this.interpreter.parse(option));
  }

  onSearchOptionSelected(option: string): void {
    this.inputControl.setValue(option);
    const isADefaultOption = option === this.defaultOption.name;
    if (isADefaultOption) this.inputControl.setValue('');
    else this.searchOptionSelected.emit(this.interpreter.parse(option));
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
