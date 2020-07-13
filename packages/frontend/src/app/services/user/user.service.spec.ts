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
import {UserService} from './user.service';
import {of, throwError} from 'rxjs';
import {SessionStatus} from '../search/interfaces';
import {COMService} from '../com/com.service';
import {catchError} from 'rxjs/operators';

describe('UserService', () => {
  let service: UserService;
  const sessionStatus: SessionStatus = {
    permitted: false,
    expiration: new Date(),
    login: '',
  };

  const mockCOMService = {};

  const getFutureDate = (yearsAhead: number): Date => {
    return new Date(Date.now() + new Date(yearsAhead).getTime());
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{provide: COMService, useValue: mockCOMService}],
    });
    service = TestBed.inject(UserService);
    mockCOMService['fetchSessionStatus'] = () => of(sessionStatus);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('loggedIn', () => {
    it('should update the status with the new session status', done => {
      sessionStatus.permitted = true;
      sessionStatus.expiration = getFutureDate(1);

      service.loggedIn.subscribe(loggedIn => {
        expect(loggedIn).toEqual(sessionStatus.permitted);
        expect(service.session.status.expiration).toEqual(
          sessionStatus.expiration
        );
        done();
      });
    });

    it("should not update the status if the session hasn't expired", done => {
      service.session.status.permitted = true;
      service.session.status.expiration = getFutureDate(1);

      // save status
      const expectedLogginStatus = service.session.status.permitted;
      const expectedexpirationDate = service.session.status.expiration;

      // set new status (should not be updated)
      sessionStatus.permitted = !service.session.status.permitted;
      sessionStatus.expiration = getFutureDate(2);

      service.loggedIn.subscribe(loggedIn => {
        expect(loggedIn).toEqual(expectedLogginStatus);
        expect(service.session.status.expiration).toEqual(
          expectedexpirationDate
        );
        done();
      });
    });

    it('should return false if an error occurs', done => {
      const initialLogginStatus = true;
      const expectedexpirationDate = new Date(1900, 4);

      service.session.status.permitted = initialLogginStatus;
      service.session.status.expiration = expectedexpirationDate;

      mockCOMService['fetchSessionStatus'] = () => throwError('');

      service.loggedIn
        .pipe(
          catchError(() => {
            fail();
            return of();
          })
        )
        .subscribe(loggedIn => {
          expect(loggedIn).toEqual(!initialLogginStatus);
          // saved the expiration date
          expect(service.session.status.expiration).toEqual(
            expectedexpirationDate
          );
          done();
        });
    });
  });
});
