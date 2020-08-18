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
    successfulRemoval: {
      message: 'Deletion successfully performed!',
      snackConfig: {duration: 3000},
    },
    removalNotAllowed: {
      message: 'You do not have permission to perform this deletion.',
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

  showSuccessfulRemoval() {
    this._snackBar.open(
      this.scenarios.successfulRemoval.message,
      undefined,
      this.scenarios.successfulRemoval.snackConfig
    );
  }

  showRemovalNotAllowed() {
    this._snackBar.open(
      this.scenarios.removalNotAllowed.message,
      undefined,
      this.scenarios.removalNotAllowed.snackConfig
    );
  }
}

interface Scenario {
  message: string;
  snackConfig: MatSnackBarConfig;
}
interface AllScenarios {
  connectionError: Scenario;
  successfulRemoval: Scenario;
  removalNotAllowed: Scenario;
}
