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
import {DomSanitizer, SafeUrl} from '@angular/platform-browser';
import {environment} from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UtilsService {
  constructor(public sanitizer: DomSanitizer) {}

  parseUrl(url: string): SafeUrl {
    // TODO: should be done on the server ideally
    url = url?.replace('git://', 'https://');
    return this.sanitizeUrl(url);
  }

  private sanitizeUrl(url: string): SafeUrl {
    return environment.production
      ? url
      : this.sanitizer.bypassSecurityTrustUrl(url);
  }
}
