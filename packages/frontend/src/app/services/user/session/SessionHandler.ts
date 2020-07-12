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
import {COMService} from '../../com/com.service';
import {SessionStatus} from '../../search/interfaces';
import {catchError} from 'rxjs/operators';
import {of, Observable} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SessionHandler {
  status: SessionStatus;

  constructor(private com: COMService) {
    this.status = {
      permitted: false,
      login: '',
    };
  }

  get loggedIn(): Observable<boolean> {
    return new Observable(subscriber => {
      if (this._loggedIn()) {
        subscriber.next(true);
      } else {
        this.fetchSession().subscribe(newStatus => {
          this.updateStatus(newStatus);
          subscriber.next(this.status.permitted);
        });
      }
    });
  }

  private _loggedIn(): boolean {
    const expired =
      this.status.expiration && Date.now() > this.status.expiration.getTime();
    return this.status.permitted && !expired;
  }

  private fetchSession(): Observable<SessionStatus> {
    return this.com.fetchSessionStatus().pipe(
      catchError(() => {
        this.status.permitted = false;
        return of(this.status);
      })
    );
  }

  private updateStatus(newStatus: SessionStatus): void {
    this.status.permitted = newStatus.permitted;
    this.status.expiration = newStatus.expiration;
    this.status.login = newStatus.login;
  }
}
