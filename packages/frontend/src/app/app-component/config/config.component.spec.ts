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

import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {ConfigComponent} from './config.component';
import {By} from '@angular/platform-browser';
import {MatDividerModule} from '@angular/material/divider';
import {MatIconModule} from '@angular/material/icon';
import {UserService} from 'src/app/services/user/user.service';
import {of} from 'rxjs';
import {RouterTestingModule} from "@angular/router/testing";
import {environment} from 'src/environments/environment';
import {inject} from '@angular/core';
import {Location} from '@angular/common';

describe('ConfigComponent', () => {
  let component: ConfigComponent;
  let fixture: ComponentFixture<ConfigComponent>;
  let location: Location;

  const mockUserService = {
    loggedIn: of(true),
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ConfigComponent],
      imports: [MatDividerModule, MatIconModule, RouterTestingModule],
      providers: [{provide: UserService, useValue: mockUserService}],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfigComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should reverse the current token display option', async () => {
    let expectedTokenDisplayOption = !component.showToken;
    component.showAdminView = true;
    await fixture.detectChanges();

    // click show
    const showButton: HTMLLinkElement = fixture.debugElement.query(
      By.css('#token-show')
    ).nativeElement;
    showButton.click();

    // token is visible
    expect(component.showToken).toEqual(expectedTokenDisplayOption);

    // click hide
    showButton.click();

    // token is hidden
    expectedTokenDisplayOption = !expectedTokenDisplayOption;
    expect(component.showToken).toEqual(expectedTokenDisplayOption);
  });

  //test the export csv file button
  it('should call the appropriate download link', async () => {
    component.showAdminView = false;
    component.orgName = 'testOrg';
    component.repoName = 'testRepo';
    component.envUrl = environment.baseUrl;
    await fixture.detectChanges();

    //click the export csv button
    const downloadButton = fixture.debugElement.nativeElement.querySelector(
      '.download-button'
    );
    downloadButton.click();
    
    fixture.whenStable().then(() => {
      expect(location.path()).toEqual(this.envUrl+'/api/repo/testOrg/testRepo/csv');
    });
  });
});
