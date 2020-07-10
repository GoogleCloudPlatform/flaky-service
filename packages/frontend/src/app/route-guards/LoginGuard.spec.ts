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
import {LoginGuard} from './LoginGuard';
import {ActivatedRouteSnapshot} from '@angular/router';

describe('LoginGuard', () => {
  let guard: LoginGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(LoginGuard);
    guard.loctionProvider = {href: ''} as Location;
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  describe('canActivate', () => {
    it('should redirect to the data url and return true', () => {
      const route: ActivatedRouteSnapshot = new ActivatedRouteSnapshot();
      route.data = {url: 'loginUrl'};

      expect(guard.canActivate(route)).toBeTrue();

      expect(guard.loctionProvider.href).toEqual(route.data.url);
    });
  });
});
