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
import {HeatMapComponent} from './heat-map.component';
import {of, empty} from 'rxjs';
import {COMService} from '../services/com/com.service';
import {MatSidenavModule} from '@angular/material/sidenav';
import {ScrollingModule} from '@angular/cdk/scrolling';
import {MatDividerModule} from '@angular/material/divider';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MatListModule} from '@angular/material/list';
import {By} from '@angular/platform-browser';
import {mockBuilds} from './mockBuilds.spec';
import {mockBatches} from './mockBatches.spec';
import * as moment from 'moment';

describe('HeatMapComponent', () => {
  let component: HeatMapComponent;
  let fixture: ComponentFixture<HeatMapComponent>;

  // mock services
  const mockCOMService = {
    fetchBatches: () => of(mockBatches.none),
    fetchBatch: () => of(mockBuilds.none),
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [HeatMapComponent],
      providers: [{provide: COMService, useValue: mockCOMService}],
      imports: [
        BrowserAnimationsModule,
        MatSidenavModule,
        ScrollingModule,
        MatDividerModule,
        MatListModule,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HeatMapComponent);
    component = fixture.componentInstance;
    fixture.autoDetectChanges(true);
    component.config.weeksToDisplay = 2;
    component.config.daysToDisplay = 7;
    component.init('', '');
  });

  afterEach(() => {
    delete mockBatches._3PreviousDays[0]['builds'];
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it("should emit 'loadingComplete' when the builds are received", done => {
    mockCOMService.fetchBatches = () => of(mockBatches._3PreviousDays);

    component.loadingComplete.subscribe(() => {
      // loadingComplete was emitted
      expect().nothing();
      done();
    });

    component.init('', '');
  });

  it("should emit 'loadingComplete' when an empty response is received", done => {
    mockCOMService.fetchBatches = () => empty();

    component.loadingComplete.subscribe(() => {
      // loadingComplete was emitted
      expect().nothing();
      done();
    });

    component.init('', '');
  });

  it('should render every cell', () => {
    mockCOMService.fetchBatches = () => of(mockBatches.none);
    const cols = 10,
      rows = 7,
      expectedCellsCount = cols * rows;
    component.config.weeksToDisplay = cols;
    component.config.daysToDisplay = rows;

    component.init('', '');

    const dataHolder = fixture.debugElement.query(
      By.css(component.dataHolderSelector)
    );

    expect(dataHolder.queryAll(By.css('rect')).length).toEqual(
      expectedCellsCount
    );
  });

  it('should set the right colors in the cells', () => {
    mockCOMService.fetchBatches = () => of(mockBatches._3PreviousDays);
    component.init('', '');

    const dataHolder = fixture.debugElement.query(
      By.css(component.dataHolderSelector)
    );

    // ignore the first week
    const rects = dataHolder.queryAll(By.css('rect')).reverse().slice(7);

    mockBatches._3PreviousDays.forEach(batch => {
      expect(rects[batch.row].styles['fill']).toEqual(batch.expectedColor);
    });
  });

  it('should fetch and save the builds when a valid cell is selected for the first time', done => {
    mockCOMService.fetchBatches = () => of(mockBatches._3PreviousDays);
    mockCOMService.fetchBatch = () => of([mockBuilds._3PreviousDays[0]]);
    const buildsFetcher = spyOn(mockCOMService, 'fetchBatch').and.callThrough();
    component.init('', '');

    const dataHolder = fixture.debugElement.query(
      By.css(component.dataHolderSelector)
    );

    // click on a valid cell
    const rects = dataHolder.queryAll(By.css('rect')).reverse().slice(7);
    const batch = mockBatches._3PreviousDays[0];
    rects[batch.row].nativeElement.dispatchEvent(new Event('click'));
    fixture.detectChanges();

    setTimeout(() => {
      // The builds have been requested
      expect(buildsFetcher).toHaveBeenCalledTimes(1);

      // The builds have been saved
      expect(batch['builds'].length).toEqual(1);
      expect(batch['builds'][0]).toEqual(mockBuilds._3PreviousDays[0]);

      // The builds have been rendered
      const renderedBuilds = fixture.debugElement.queryAll(By.css('.build'));
      expect(renderedBuilds.length).toEqual(1);
      expect(
        renderedBuilds[0].query(By.css('.build-link')).nativeElement.textContent
      ).toEqual(mockBuilds._3PreviousDays[0].buildmessage);
      done();
    });
  });

  it('should not fetch the builds if they are already present', done => {
    mockCOMService.fetchBatches = () => of(mockBatches._3PreviousDays);
    mockCOMService.fetchBatch = () => of([mockBuilds._3PreviousDays[0]]);
    const buildsFetcher = spyOn(mockCOMService, 'fetchBatch').and.callThrough();
    component.init('', '');

    const dataHolder = fixture.debugElement.query(
      By.css(component.dataHolderSelector)
    );

    // preset the builds
    const batch = mockBatches._3PreviousDays[0];
    batch['builds'] = [mockBuilds._3PreviousDays[0]];

    // click on a valid cell
    const rects = dataHolder.queryAll(By.css('rect')).reverse().slice(7);
    rects[batch.row].nativeElement.dispatchEvent(new Event('click'));
    fixture.detectChanges();

    setTimeout(() => {
      // The builds have NOT been requested
      expect(buildsFetcher).not.toHaveBeenCalled();

      // The saved build have been rendered
      const renderedBuilds = fixture.debugElement.queryAll(By.css('.build'));
      expect(renderedBuilds.length).toEqual(1);
      expect(
        renderedBuilds[0].query(By.css('.build-link')).nativeElement.textContent
      ).toEqual(mockBuilds._3PreviousDays[0].buildmessage);
      done();
    });
  });

  it('should not show the builds when an invalid cell is selected', fakeAsync(() => {
    mockCOMService.fetchBatches = () => of(mockBatches.none);
    component.init('', '');

    const dataHolder = fixture.debugElement.query(
      By.css(component.dataHolderSelector)
    );

    const rects = dataHolder.queryAll(By.css('rect')).reverse();
    rects[0].nativeElement.dispatchEvent(new Event('click'));
    fixture.detectChanges();
    tick();

    const builds = fixture.debugElement.queryAll(By.css('.build'));
    expect(builds.length).toEqual(0);
  }));

  it('should show the tooltip when the mouse hovers a cell', fakeAsync(() => {
    const dataHolder = fixture.debugElement.query(
      By.css(component.dataHolderSelector)
    );

    const rects = dataHolder.queryAll(By.css('rect')).reverse();
    rects[0].nativeElement.dispatchEvent(new Event('mouseover'));
    fixture.detectChanges();
    tick();

    const tooltip = fixture.debugElement.query(By.css('.tooltip'));
    expect(tooltip.styles['visibility']).toEqual('visible');
  }));

  it('should hide the tooltip when the mouse leaves a cell', fakeAsync(() => {
    const dataHolder = fixture.debugElement.query(
      By.css(component.dataHolderSelector)
    );
    const tooltip = fixture.debugElement.query(By.css('.tooltip'));
    tooltip.styles['visibility'] = 'visible';

    const rects = dataHolder.queryAll(By.css('rect')).reverse();
    rects[0].nativeElement.dispatchEvent(new Event('mouseleave'));
    fixture.detectChanges();
    tick();

    expect(tooltip.styles['visibility']).toEqual('hidden');
  }));

  it('should show the right text in the tooltip when the mouse hovers a success cell', fakeAsync(() => {
    mockCOMService.fetchBatches = () => of(mockBatches._3PreviousDays);
    component.init('', '');
    tick();

    const dataHolder = fixture.debugElement.query(
      By.css(component.dataHolderSelector)
    );

    const batch = mockBatches._3PreviousDays[0];
    const rects = dataHolder.queryAll(By.css('rect')).reverse().slice(7);

    rects[batch.row].nativeElement.dispatchEvent(new Event('mousemove'));
    fixture.detectChanges();
    tick();

    const tooltip = fixture.debugElement.query(By.css('.tooltip'));
    const buildTime = moment.unix(batch.timestamp).format('MMM D, YYYY');
    const expectedText = '2 passing on ' + buildTime;
    expect(tooltip.nativeElement.textContent.trim()).toEqual(expectedText);
  }));

  it('should show the right text in the tooltip when the mouse hovers a flaky cell', fakeAsync(() => {
    mockCOMService.fetchBatches = () => of(mockBatches._3PreviousDays);
    component.init('', '');
    tick();

    const dataHolder = fixture.debugElement.query(
      By.css(component.dataHolderSelector)
    );

    const batch = mockBatches._3PreviousDays[2];
    const rects = dataHolder.queryAll(By.css('rect')).reverse().slice(7);

    rects[batch.row].nativeElement.dispatchEvent(new Event('mousemove'));
    fixture.detectChanges();
    tick();

    const tooltip = fixture.debugElement.query(By.css('.tooltip'));
    const buildTime = moment.unix(batch.timestamp).format('MMM D, YYYY');
    const expectedText = '1 flaky on ' + buildTime;
    expect(tooltip.nativeElement.textContent.trim()).toEqual(expectedText);
  }));

  it('should show the right text in the tooltip when the mouse hovers a failling cell', fakeAsync(() => {
    mockCOMService.fetchBatches = () => of(mockBatches._3PreviousDays);
    component.init('', '');
    tick();

    const dataHolder = fixture.debugElement.query(
      By.css(component.dataHolderSelector)
    );

    const batch = mockBatches._3PreviousDays[1];
    const rects = dataHolder.queryAll(By.css('rect')).reverse().slice(7);

    rects[batch.row].nativeElement.dispatchEvent(new Event('mousemove'));
    fixture.detectChanges();
    tick();

    const tooltip = fixture.debugElement.query(By.css('.tooltip'));
    const buildTime = moment.unix(batch.timestamp).format('MMM D, YYYY');
    const expectedText = '1 failing on ' + buildTime;
    expect(tooltip.nativeElement.textContent.trim()).toEqual(expectedText);
  }));

  it('should show the right text in the tooltip when the mouse hovers a blank cell', fakeAsync(() => {
    mockCOMService.fetchBatches = () => of(mockBatches._3PreviousDays);
    component.init('', '');
    tick();

    const dataHolder = fixture.debugElement.query(
      By.css(component.dataHolderSelector)
    );

    const rects = dataHolder.queryAll(By.css('rect')).reverse();

    rects[0].nativeElement.dispatchEvent(new Event('mousemove'));
    fixture.detectChanges();
    tick();

    const tooltip = fixture.debugElement.query(By.css('.tooltip'));
    expect(
      tooltip.nativeElement.textContent.trim().startsWith('No build on ')
    ).toBeTrue();
  }));
});
