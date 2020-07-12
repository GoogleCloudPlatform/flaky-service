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

import {
  async,
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import {Location} from '@angular/common';
import {NotFoundComponent} from './not-found.component';
import {By} from '@angular/platform-browser';
import {Router} from '@angular/router';
import {AppRoutingModule} from '../routing/app-routing.module';
import {NgZone} from '@angular/core';

describe('NotFoundComponent', () => {
  let component: NotFoundComponent;
  let fixture: ComponentFixture<NotFoundComponent>;
  let router: Router;
  let location: Location;
  let ngZone: NgZone;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [NotFoundComponent],
      imports: [AppRoutingModule],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NotFoundComponent);
    component = fixture.componentInstance;
    fixture.autoDetectChanges(true);
    router = TestBed.get(Router);
    location = TestBed.get(Location);
    ngZone = TestBed.get(NgZone);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should redirect to the previous page when the user clicks on the corresponding anchor', () => {
    const headBackAnchor: HTMLAnchorElement = fixture.debugElement.query(
      By.css('.head-back-anchor')
    ).nativeElement;

    const locationBackSpy = spyOn(location, 'back');

    headBackAnchor.click();

    expect(locationBackSpy).toHaveBeenCalledTimes(1);
  });

  it('should redirect to the home page when the user clicks on the corresponding anchor', fakeAsync(() => {
    ngZone.run(() => {
      const homeAnchor: HTMLAnchorElement = fixture.debugElement.query(
        By.css('.home-anchor')
      ).nativeElement;

      router.navigate(['search']);
      tick();
      expect(location.path()).toEqual('/search');

      homeAnchor.click();

      tick();

      expect(location.path()).toEqual('');
    });
  }));
});
