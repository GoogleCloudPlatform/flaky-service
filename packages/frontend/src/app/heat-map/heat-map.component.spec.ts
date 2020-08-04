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
import {HeatMapComponent} from './heat-map.component';
import {of} from 'rxjs';
import {COMService} from '../services/com/com.service';
import {MatSidenavModule} from '@angular/material/sidenav';
import {ScrollingModule} from '@angular/cdk/scrolling';
import {MatDividerModule} from '@angular/material/divider';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MatListModule} from '@angular/material/list';
import {By} from '@angular/platform-browser';
import {mockBuilds} from './mockBuilds.spec';
import * as moment from 'moment';

describe('HeatMapComponent', () => {
  let component: HeatMapComponent;
  let fixture: ComponentFixture<HeatMapComponent>;

  // mock services
  const mockCOMService = {
    fetchBuilds: () => of({builds: mockBuilds.none}),
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

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it("should emit 'loadingComplete' when the builds are received", done => {
    mockCOMService.fetchBuilds = () => of({builds: mockBuilds.none});

    component.loadingComplete.subscribe(() => {
      // loadingComplete was emitted
      expect().nothing();
      done();
    });

    component.init('', '');
  });

  it('should render every cell', () => {
    mockCOMService.fetchBuilds = () => of({builds: mockBuilds.none});
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
    mockCOMService.fetchBuilds = () => of({builds: mockBuilds._3PreviousDays});
    component.init('', '');

    const dataHolder = fixture.debugElement.query(
      By.css(component.dataHolderSelector)
    );

    // ignore the first week
    const rects = dataHolder.queryAll(By.css('rect')).reverse().slice(7);

    mockBuilds._3PreviousDays.forEach(build => {
      expect(rects[build.row].styles['fill']).toEqual(build.expectedColor);
    });
  });

  it('should show the builds when a valid cell is selected', done => {
    mockCOMService.fetchBuilds = () => of({builds: mockBuilds._3PreviousDays});
    component.init('', '');

    const dataHolder = fixture.debugElement.query(
      By.css(component.dataHolderSelector)
    );

    // click on a valid cell
    const rects = dataHolder.queryAll(By.css('rect')).reverse().slice(7);
    rects[mockBuilds._3PreviousDays[0].row].nativeElement.dispatchEvent(
      new Event('click')
    );
    fixture.detectChanges();

    setTimeout(() => {
      const builds = fixture.debugElement.queryAll(By.css('.build'));
      expect(builds.length).toEqual(2);
      expect(
        builds[0].query(By.css('.build-link')).nativeElement.textContent
      ).toEqual('#' + mockBuilds._3PreviousDays[0].buildmessage);
      expect(
        builds[1].query(By.css('.build-link')).nativeElement.textContent
      ).toEqual('#' + mockBuilds._3PreviousDays[1].buildmessage);
      done();
    });
  });

  it('should not show the builds when an invalid cell is selected', done => {
    mockCOMService.fetchBuilds = () => of({builds: mockBuilds._3PreviousDays});
    component.init('', '');

    const dataHolder = fixture.debugElement.query(
      By.css(component.dataHolderSelector)
    );

    const rects = dataHolder.queryAll(By.css('rect')).reverse();
    rects[0].nativeElement.dispatchEvent(new Event('click'));
    fixture.detectChanges();

    setTimeout(() => {
      const builds = fixture.debugElement.queryAll(By.css('.build'));
      expect(builds.length).toEqual(0);
      done();
    });
  });

  it('should show the tooltip when the mouse hovers a cell', done => {
    const dataHolder = fixture.debugElement.query(
      By.css(component.dataHolderSelector)
    );

    const rects = dataHolder.queryAll(By.css('rect')).reverse();
    rects[0].nativeElement.dispatchEvent(new Event('mouseover'));
    fixture.detectChanges();

    setTimeout(() => {
      const tooltip = fixture.debugElement.query(By.css('.tooltip'));
      expect(tooltip.styles['visibility']).toEqual('visible');
      done();
    });
  });

  it('should hide the tooltip when the mouse leaves a cell', done => {
    const dataHolder = fixture.debugElement.query(
      By.css(component.dataHolderSelector)
    );
    const tooltip = fixture.debugElement.query(By.css('.tooltip'));
    tooltip.styles['visibility'] = 'visible';

    const rects = dataHolder.queryAll(By.css('rect')).reverse();
    rects[0].nativeElement.dispatchEvent(new Event('mouseleave'));
    fixture.detectChanges();

    setTimeout(() => {
      expect(tooltip.styles['visibility']).toEqual('hidden');
      done();
    });
  });

  it('should show the right text in the tooltip when the mouse hovers a success cell', done => {
    mockCOMService.fetchBuilds = () => of({builds: mockBuilds._3PreviousDays});
    component.init('', '');

    const dataHolder = fixture.debugElement.query(
      By.css(component.dataHolderSelector)
    );

    const build = mockBuilds._3PreviousDays[0];
    const rects = dataHolder.queryAll(By.css('rect')).reverse().slice(7);

    rects[build.row].nativeElement.dispatchEvent(new Event('mousemove'));
    fixture.detectChanges();

    setTimeout(() => {
      const tooltip = fixture.debugElement.query(By.css('.tooltip'));
      const buildTime = moment
        .unix(build.timestamp._seconds)
        .format('MMM D, YYYY');
      const expectedText = '2 passing on ' + buildTime;
      expect(tooltip.nativeElement.textContent.trim()).toEqual(expectedText);
      done();
    });
  });

  it('should show the right text in the tooltip when the mouse hovers a flaky cell', done => {
    mockCOMService.fetchBuilds = () => of({builds: mockBuilds._3PreviousDays});
    component.init('', '');

    const dataHolder = fixture.debugElement.query(
      By.css(component.dataHolderSelector)
    );

    const build = mockBuilds._3PreviousDays[3];
    const rects = dataHolder.queryAll(By.css('rect')).reverse().slice(7);

    rects[build.row].nativeElement.dispatchEvent(new Event('mousemove'));
    fixture.detectChanges();

    setTimeout(() => {
      const tooltip = fixture.debugElement.query(By.css('.tooltip'));
      const buildTime = moment
        .unix(build.timestamp._seconds)
        .format('MMM D, YYYY');
      const expectedText = '1 flaky on ' + buildTime;
      expect(tooltip.nativeElement.textContent.trim()).toEqual(expectedText);
      done();
    });
  });

  it('should show the right text in the tooltip when the mouse hovers a failling cell', done => {
    mockCOMService.fetchBuilds = () => of({builds: mockBuilds._3PreviousDays});
    component.init('', '');

    const dataHolder = fixture.debugElement.query(
      By.css(component.dataHolderSelector)
    );

    const build = mockBuilds._3PreviousDays[2];
    const rects = dataHolder.queryAll(By.css('rect')).reverse().slice(7);

    rects[build.row].nativeElement.dispatchEvent(new Event('mousemove'));
    fixture.detectChanges();

    setTimeout(() => {
      const tooltip = fixture.debugElement.query(By.css('.tooltip'));
      const buildTime = moment
        .unix(build.timestamp._seconds)
        .format('MMM D, YYYY');
      const expectedText = '1 failing on ' + buildTime;
      expect(tooltip.nativeElement.textContent.trim()).toEqual(expectedText);
      done();
    });
  });

  it('should show the right text in the tooltip when the mouse hovers a blank cell', done => {
    mockCOMService.fetchBuilds = () => of({builds: mockBuilds._3PreviousDays});
    component.init('', '');

    const dataHolder = fixture.debugElement.query(
      By.css(component.dataHolderSelector)
    );

    const rects = dataHolder.queryAll(By.css('rect')).reverse();

    rects[0].nativeElement.dispatchEvent(new Event('mousemove'));
    fixture.detectChanges();

    setTimeout(() => {
      const tooltip = fixture.debugElement.query(By.css('.tooltip'));
      expect(
        tooltip.nativeElement.textContent.trim().startsWith('No build on ')
      ).toBeTrue();
      done();
    });
  });
});
