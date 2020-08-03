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
  tick,
  fakeAsync,
} from '@angular/core/testing';
import {ConfigComponent} from './config.component';
import {MatDividerModule} from '@angular/material/divider';
import {MatIconModule} from '@angular/material/icon';

describe('ConfigComponent', () => {
  let component: ConfigComponent;
  let fixture: ComponentFixture<ConfigComponent>;

  const mockWindowProvider = {
    open: () => {},
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ConfigComponent],
      imports: [MatDividerModule, MatIconModule],
      providers: [{provide: Window, useValue: mockWindowProvider}],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfigComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  //test the export csv file button
  it('should open a new tab with the correct url when export button is clicked', fakeAsync(() => {
    component.orgName = 'testOrg';
    component.repoName = 'testRepo';
    component.windowProvider = (mockWindowProvider as unknown) as typeof window;
    fixture.detectChanges();
    //spy on the new window
    spyOn(component.windowProvider, 'open');
    //click the export csv button
    const downloadButton = fixture.debugElement.nativeElement.querySelector(
      '#download-button'
    );
    downloadButton.click();
    tick();
    expect(component.windowProvider.open).toHaveBeenCalled();
  }));
});
