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

import {TestBed} from '@angular/core/testing';
import {SnackBarService} from './snack-bar.service';
import {MatSnackBarModule} from '@angular/material/snack-bar';

describe('SnackBarService', () => {
  let service: SnackBarService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MatSnackBarModule],
    });
    service = TestBed.inject(SnackBarService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('showConnectionError', () => {
    it('should show the snack bar with the error message', () => {
      const snackOpener = spyOn(service._snackBar, 'open');

      service.showConnectionError();

      expect(snackOpener).toHaveBeenCalledWith(
        "The server can't be reached. Please try again.",
        undefined,
        jasmine.objectContaining({duration: 5000})
      );
    });
  });

  describe('showSuccessfulTestRemoval', () => {
    it('should show the snack bar with the error message', () => {
      const snackOpener = spyOn(service._snackBar, 'open');

      service.showSuccessfulTestRemoval();

      expect(snackOpener).toHaveBeenCalledWith(
        'Test successfully removed !',
        undefined,
        jasmine.objectContaining({duration: 3000})
      );
    });
  });

  describe('showNotAllowed', () => {
    it('should show the snack bar with the error message', () => {
      const snackOpener = spyOn(service._snackBar, 'open');

      service.showNotAllowed();

      expect(snackOpener).toHaveBeenCalledWith(
        'You do not have the permission to perform this action.',
        undefined,
        jasmine.objectContaining({duration: 3000})
      );
    });
  });
});
