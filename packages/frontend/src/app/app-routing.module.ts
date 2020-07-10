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

import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {HomeComponent} from './home/home.component';
import {LicenseComponent} from './license/license.component';
import {MainComponent} from './main/main.component';
import {RepositoryComponent} from './repository/repository.component';
import {BuildComponent} from './build/build.component';
import {NotFoundComponent} from './not-found/not-found.component';
import {apiLinks} from './services/com/api';
import {LoginGuard} from './route-guards/LoginGuard';

const routes: Routes = [
  {path: '', component: HomeComponent},
  {path: 'license', component: LicenseComponent},
  {path: 'search', component: MainComponent},
  {path: 'org/:org/:repo', component: RepositoryComponent},
  {path: 'org/:org', component: MainComponent},
  {path: 'org/:org/:repo/:build', component: BuildComponent},
  {
    path: 'login',
    canActivate: [LoginGuard],
    data: {url: apiLinks.get.loginLink},
    component: HomeComponent,
  },
  {path: '**', component: NotFoundComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [LoginGuard],
})
export class AppRoutingModule {}
