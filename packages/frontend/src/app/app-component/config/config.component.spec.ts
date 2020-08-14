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
import {of, empty, NEVER} from 'rxjs';
import {COMService} from 'src/app/services/com/com.service';
import {Component} from '@angular/core';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';

@Component({
  selector: 'app-repository-removal-dialog',
})
class RepositoryRemovalDialogComponent {}

describe('ConfigComponent', () => {
  let component: ConfigComponent;
  let fixture: ComponentFixture<ConfigComponent>;
  let confirmationDialog;
  const mockUrl = 'https://flaky-dashboard.web.app/api';

  const mockWindowProvider = {
    open: () => {},
  };

  const comMock = {fetchDeleteRepoUrl: () => of(mockUrl)};

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ConfigComponent, RepositoryRemovalDialogComponent],
      imports: [MatDividerModule, MatIconModule, MatDialogModule],
      providers: [
        {provide: Window, useValue: mockWindowProvider},
        {provide: COMService, useValue: comMock},
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    confirmationDialog = TestBed.get(MatDialog);
    fixture = TestBed.createComponent(ConfigComponent);
    component = fixture.componentInstance;
    component.windowProvider = (mockWindowProvider as unknown) as typeof window;
    comMock.fetchDeleteRepoUrl = () => of(mockUrl);
    component.orgName = 'testOrg';
    component.repoName = 'testRepo';
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  //test the export csv file button
  it('should open a new tab with the correct url when export button is clicked', fakeAsync(() => {
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

  //test the delete repo button
  it('should redirect to the deleteRepo url when delete repo button is clicked', fakeAsync(() => {
    spyOn(component.windowProvider, 'open');
    spyOn(confirmationDialog, 'open').and.returnValue({
      afterClosed: () => of(true),
    });

    // click the repo deletion button
    const deleteButton = fixture.debugElement.nativeElement.querySelector(
      '#delete-repo-button'
    );
    deleteButton.click();
    tick();

    expect(component.windowProvider.open).toHaveBeenCalledWith(
      mockUrl,
      '_self'
    );
  }));

  it('should disable the removal button when the removal process is pending', fakeAsync(() => {
    spyOn(component.windowProvider, 'open');
    spyOn(confirmationDialog, 'open').and.returnValue({
      afterClosed: () => of(true),
    });

    comMock.fetchDeleteRepoUrl = () => NEVER;

    // click the repo deletion button
    const deleteButton = fixture.debugElement.nativeElement.querySelector(
      '#delete-repo-button'
    );
    deleteButton.click();
    tick();

    expect(component.repoRemovalButtonDisbaled).toBeTrue();
  }));

  it('should re-enable the repo removal button when the user selects No in the confirmation dialog', fakeAsync(() => {
    spyOn(component.windowProvider, 'open');
    // user will have selected "No thanks"
    spyOn(confirmationDialog, 'open').and.returnValue({
      afterClosed: () => of(false),
    });

    // click the repo deletion button
    const deleteButton = fixture.debugElement.nativeElement.querySelector(
      '#delete-repo-button'
    );
    deleteButton.click();
    tick();

    expect(component.repoRemovalButtonDisbaled).toBeFalse();
  }));

  it('should re-enable the repo removal button when an error occurs', fakeAsync(() => {
    spyOn(component.windowProvider, 'open');
    spyOn(confirmationDialog, 'open').and.returnValue({
      afterClosed: () => of(true),
    });

    // the com service handled the error
    comMock.fetchDeleteRepoUrl = () => empty();

    // click the repo deletion button
    const deleteButton = fixture.debugElement.nativeElement.querySelector(
      '#delete-repo-button'
    );
    deleteButton.click();
    tick();

    expect(component.repoRemovalButtonDisbaled).toBeFalse();
  }));
});
