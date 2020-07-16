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

import {Component, Output} from '@angular/core';
import {UserService} from 'src/app/services/user/user.service';

@Component({
  selector: 'app-config',
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.css'],
})
export class ConfigComponent {
  linkedGithubAccounts = [
    {name: 'account 1'},
    {name: 'account 2'},
    {name: 'account 3'},
    {name: 'account 4'},
    {name: 'account 5'},
  ];

  token = 'MF93N60H857HBGN65GHBN035GHB0PJN605';
  showToken = false;
  showAdminView = false;

  constructor(public userService: UserService) {}

  @Output() onConfigsOpening() {
    this.userService.loggedIn.subscribe(
      loggedIn => (this.showAdminView = loggedIn)
    );
  }

  onTokenClick() {
    this.showToken = !this.showToken;
  }
}
