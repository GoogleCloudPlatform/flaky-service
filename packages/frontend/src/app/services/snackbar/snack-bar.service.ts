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

import {Injectable} from '@angular/core';
import {MatSnackBar, MatSnackBarConfig} from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class SnackBarService {
  readonly snackOptions = {
    duration: 2000,
  };

  readonly scenarios: AllScenarios = {
    connectionError: {
      message: "The server can't be reached. Please try again.",
      snackConfig: {duration: 5000},
    },
    successfulTestRemoval: {
      message: 'Test successfully removed !',
      snackConfig: {duration: 3000},
    },
    notAllowed: {
      message: 'You do not have the permission to perform this action.',
      snackConfig: {duration: 3000},
    },
  };

  constructor(public _snackBar: MatSnackBar) {}

  showConnectionError() {
    this._snackBar.open(
      this.scenarios.connectionError.message,
      undefined,
      this.scenarios.connectionError.snackConfig
    );
  }

  showSuccessfulTestRemoval() {
    this._snackBar.open(
      this.scenarios.successfulTestRemoval.message,
      undefined,
      this.scenarios.successfulTestRemoval.snackConfig
    );
  }

  showNotAllowed() {
    this._snackBar.open(
      this.scenarios.notAllowed.message,
      undefined,
      this.scenarios.notAllowed.snackConfig
    );
  }
}

interface Scenario {
  message: string;
  snackConfig: MatSnackBarConfig;
}
interface AllScenarios {
  connectionError: Scenario;
  successfulTestRemoval: Scenario;
  notAllowed: Scenario;
}
