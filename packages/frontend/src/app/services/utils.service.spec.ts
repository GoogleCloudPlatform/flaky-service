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
import {UtilsService} from './utils.service';
import {environment} from 'src/environments/environment';

describe('UtilsService', () => {
  let service: UtilsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UtilsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('parseUrl', () => {
    const url = 'https://github.com/org/repo.git';
    const gitUrl = 'git://github.com/org/repo.git';

    beforeEach(() => {
      environment.production = true;
    });

    it('should return the web link corresponding to a git link', () => {
      expect(service.parseUrl(gitUrl)).toEqual(url);
    });

    it('should return the same url when in production', () => {
      expect(service.parseUrl(url)).toEqual(url);
    });

    it('should return a safe url in development', () => {
      environment.production = false;
      expect(service.parseUrl(url)).toEqual(
        service.sanitizer.bypassSecurityTrustUrl(url)
      );
    });

    describe('isJson', () => {
      it('should return true for a valid JSON object', () => {
        const validObjects = [
          '{}',
          '{"a": 1}',
          '{"a": {"b": 1}}',
          '{"a": "a"}',
        ];
        validObjects.forEach(obj => expect(service.isPureJson(obj)).toBeTrue());
      });
      it('should return false for an valid JSON object', () => {
        const invalidObjects = [
          '123',
          'a',
          '{',
          '}',
          '{{}',
          '{}}',
          '[]',
          '',
          null,
          undefined,
        ];
        invalidObjects.forEach(obj =>
          expect(service.isPureJson(obj)).toBeFalse()
        );
      });
    });
  });
});
