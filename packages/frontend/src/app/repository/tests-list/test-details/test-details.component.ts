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

import {Component, Input} from '@angular/core';
import {Test} from 'src/app/services/search/interfaces';
import {COMService} from '../../../services/com/com.service';
import {environment} from '../../../../environments/environment';
import {RouteProvider} from 'src/app/routing/route-provider/RouteProvider';

@Component({
  selector: 'app-test-details',
  templateUrl: './test-details.component.html',
  styleUrls: ['./test-details.component.css'],
})
export class TestDetailsComponent {
  constructor(public comService: COMService) {}
  @Input() test: Test;
  @Input() repoName: string;
  @Input() orgName: string;
  @Input() removalButtonState;
  windowProvider = window;

  // Converts tests' passing percentage from decimal to percentage
  toPercentage(percentpassing: number): string {
    return (percentpassing * 100).toFixed(2);
  }

  startDeleteTest() {
    this.removalButtonState.disabled = true;
    this.comService
      .fetchDeleteTestUrl(
        this.orgName,
        this.repoName,
        this.test.name,
        environment.baseUrl +
          '/' +
          RouteProvider.routes.repo.link(this.orgName, this.repoName)
      )
      .subscribe(res => {
        this.windowProvider.open(res, '_self');
      });
  }
}
