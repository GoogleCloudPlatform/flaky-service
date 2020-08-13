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
import {UserService} from 'src/app/services/user/user.service';
import {environment} from 'src/environments/environment';
import {COMService} from 'src/app/services/com/com.service';
import {RouteProvider} from 'src/app/routing/route-provider/RouteProvider';

@Component({
  selector: 'app-config',
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.css'],
})
export class ConfigComponent {
  @Input() repoName: string;
  @Input() orgName: string;
  @Input() repoRemovalButtonState;
  windowProvider = window;

  constructor(public userService: UserService, public comService: COMService) {}

  onDownloadClick() {
    const exportUrl =
      environment.baseUrl +
      '/api/repo/' +
      this.orgName +
      '/' +
      this.repoName +
      '/csv';
    this.windowProvider.open(exportUrl);
  }

  startDeleteRepo() {
    this.repoRemovalButtonState.disabled = true;
    this.comService
      .fetchDeleteRepoUrl(
        this.orgName,
        this.repoName,
        environment.baseUrl +
          '/' +
          RouteProvider.routes.repo.link(this.orgName, this.repoName)
      )
      .subscribe(res => {
        this.windowProvider.open(res, '_self');
      });
  }
}
