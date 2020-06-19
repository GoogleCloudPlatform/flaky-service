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
import {Observable} from 'rxjs';
import {map, startWith} from 'rxjs/operators';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css'],
})
export class SearchComponent implements OnInit {
  @Output() searchOptionSelected = new EventEmitter<string>();

  inputControl = new FormControl();
  options: SearchOption[] = [];
  defaultOptions: SearchOption[] = [
    {repoName: 'See all repositories', orgName: ''},
  ];
  filteredOptions: Observable<SearchOption[]>;

  ngOnInit(): void {
    this.filteredOptions = this.inputControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value))
    );
  }

  private _filter(value: string): SearchOption[] {
    const filterValue = value.toString().toLowerCase();
    return this.options
      .concat(this.defaultOptions)
      .filter(
        option =>
          option.repoName.toString().toLowerCase().includes(filterValue) ||
          option.orgName.toString().toLowerCase().includes(filterValue)
      );
  }

  onEnterKeyUp(option: string): void {
    this.searchOptionSelected.emit(option);
  }

  onSearchOptionSelected(option: string): void {
    const isADefaultOption = this.defaultOptions.find(
      opt => opt.repoName === option
    );
    if (isADefaultOption) this.inputControl.setValue(option);
    else this.searchOptionSelected.emit(option);
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
