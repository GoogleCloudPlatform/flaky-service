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

import {Component, OnInit, NgZone} from '@angular/core';
import {Search} from '../services/search/interfaces';
import {SearchService} from '../services/search/search.service';
import {ActivatedRoute, Router} from '@angular/router';
import {InterpretationService} from '../services/interpretation/interpretation.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css'],
})
export class MainComponent implements OnInit {
  constructor(
    public searchService: SearchService,
    private route: ActivatedRoute,
    private interpreter: InterpretationService,
    private ngZone: NgZone,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.searchService
        .search(this.interpreter.parseQueryObject(params))
        .subscribe();
    });
  }

  onSearchOptionSelected(option: Search): void {
    this.ngZone.run(() => {
      this.router.navigate(['search', this.interpreter.getQueryObject(option)]);
    });
  }
}
