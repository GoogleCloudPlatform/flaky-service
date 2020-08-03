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
import {BehaviorSubject} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GlobalsService {
  pageDataChange: BehaviorSubject<PageState> = new BehaviorSubject<PageState>({
    currentPage: '',
    repoName: '',
    orgName: '',
  });

  update(pageName: string, orgName?: string, repoName?: string) {
    this.pageDataChange.next({
      currentPage: pageName,
      repoName: repoName,
      orgName: orgName,
    });
  }
}

interface PageState {
  currentPage: string;
  repoName: string;
  orgName: string;
}
