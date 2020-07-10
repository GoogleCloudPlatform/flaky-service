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
import {COMService} from '../com/com.service';
import {SessionStatus} from '../search/interfaces';
import {catchError} from 'rxjs/operators';
import {of, Observable} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SessionService {
  status: SessionStatus;

  constructor(private com: COMService) {
    this.status = {
      permitted: false,
    };
  }

  update(): Observable<void> {
    return new Observable(subscriber => {
      if (this.passedExpirationDate()) {
        this.com
          .fetchSessionStatus()
          .pipe(
            catchError(err => {
              subscriber.error(err);
              return of(this.status);
            })
          )
          .subscribe(newStatus => {
            this.updateStatus(newStatus);
            subscriber.next();
          });
      } else {
        subscriber.next();
      }
    });
  }

  private passedExpirationDate(): boolean {
    const noExpirationDate = !this.status.expiration;
    const passedExpirationDate =
      this.status.permitted &&
      this.status.expiration &&
      Date.now() > this.status.expiration.getTime();
    return !this.status.permitted || noExpirationDate || passedExpirationDate;
  }

  private updateStatus(newStatus: SessionStatus): void {
    this.status.permitted = newStatus.permitted;
    this.status.expiration = newStatus.expiration;
  }
}

export interface User {
  loggedIn: boolean;
}
