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
import {TestDetailsComponent} from './test-details.component';
import {mockTests} from '../mockTests.spec';
import {By} from '@angular/platform-browser';
import {of} from 'rxjs';
import {COMService} from 'src/app/services/com/com.service';

const mockUrl = 'https://flaky-dashboard.web.app/';

const mockWindowProvider = {
  open: () => {},
};

const comMock = () => of(mockUrl);

describe('TestDetailsComponent', () => {
  let component: TestDetailsComponent;
  let fixture: ComponentFixture<TestDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TestDetailsComponent],
      providers: [{provide: COMService, useValue: comMock}],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestDetailsComponent);
    component = fixture.componentInstance;
    component.test = mockTests.tests[0];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the error message if a test is failing', () => {
    expect(
      fixture.debugElement.query(By.css('#error-msg-textarea'))
    ).toBeTruthy();
  });

  it('should not display the error message if a test is passing', () => {
    component.test = mockTests.tests[2];
    fixture.detectChanges();
    expect(
      fixture.debugElement.query(By.css('#error-msg-textarea'))
    ).toBeFalsy();
  });

  //test the delete test button
  it('should redirect to the deleteTest url when delete test button is clicked', fakeAsync(() => {
    component.orgName = 'testOrg';
    component.repoName = 'testRepo';
    component.windowProvider = (mockWindowProvider as unknown) as typeof window;
    component.comService.fetchDeleteTestUrl = comMock;
    fixture.detectChanges();
    //spy on the new window
    spyOn(component.windowProvider, 'open');
    //click the test deletion button
    const deleteButton = fixture.debugElement.nativeElement.querySelector(
      '.delete-test-button'
    );
    deleteButton.click();
    tick();
    expect(component.windowProvider.open).toHaveBeenCalledWith(
      'https://flaky-dashboard.web.app/',
      '_self'
    );
  }));
});
