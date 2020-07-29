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
import {Router} from '@angular/router';

@Component({
  selector: 'app-test-details',
  templateUrl: './test-details.component.html',
  styleUrls: ['./test-details.component.css'],
})
export class TestDetailsComponent {
constructor(
    public router: Router,
    public comService: COMService
  ) {}
  @Input() test: Test;

  toPercentage(percentpassing: number) {
    return (percentpassing * 100).toFixed(2);
  }

  startDeleteTest() {
    console.info('Tried to delete test');
    const url = this.comService.getDeleteUrl();
    console.info('returned: ' + url);
    this.router.navigateByUrl(url);
  }
}
