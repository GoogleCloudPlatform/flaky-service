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
import {BreadcrumbsComponent} from './breadcrumbs.component';
import {MatIconModule} from '@angular/material/icon';
import {Router} from '@angular/router';
import {NgZone} from '@angular/core';
import {RouteProvider} from '../routing/route-provider/RouteProvider';
import {By} from '@angular/platform-browser';
import {RouterTestingModule} from '@angular/router/testing';
import {expectedParams} from '../services/interpretation/interpretation.service';

describe('BreadcrumbsComponent', () => {
  let component: BreadcrumbsComponent;
  let fixture: ComponentFixture<BreadcrumbsComponent>;
  let router: Router;
  let ngZone: NgZone;

  const mockRouteProvider = {
    routes: {
      route1: {
        name: 'route1',
        path: ':route1',
        testPath: 'param1',
        link: (param: string) => param,
      },
      route2: {
        name: 'route2',
        path: ':route1/:route2',
        testPath: 'param1/param2',
        link: (param1: string, param2: string) => param1 + '/' + param2,
      },
      route3: {
        name: 'route3',
        path: ':route1/:route2/:route3',
        testPath: 'param1/param2/param3',
        link: (param1: string, param2: string, param3: string) =>
          param1 + '/' + param2 + '/' + param3,
      },
      route4: {
        name: 'route4',
        path: 'route4',
        testPath: 'route4',
        link: () => 'route4',
      },
    },
  };

  const mockRoutingModule = RouterTestingModule.withRoutes([
    // static route with breadcrumb data and git link
    {
      path: mockRouteProvider.routes.route4.path,
      component: BreadcrumbsComponent,
      data: {
        breadCrumbPaths: [mockRouteProvider.routes.route4.name],
        setGitLink: true,
      },
    },

    // route without breadcrumb data
    {
      path: mockRouteProvider.routes.route1.path,
      component: BreadcrumbsComponent,
    },

    // route with empty breadcrumb data
    {
      path: mockRouteProvider.routes.route2.path,
      component: BreadcrumbsComponent,
      data: {
        breadCrumbPaths: [],
      },
    },

    // route with breadcrumb data
    {
      path: mockRouteProvider.routes.route3.path,
      component: BreadcrumbsComponent,
      data: {
        breadCrumbPaths: [
          mockRouteProvider.routes.route1.name,
          mockRouteProvider.routes.route2.name,
          mockRouteProvider.routes.route3.name,
        ],
      },
    },
  ]);

  let initialRoutes;
  beforeAll(() => {
    // save the inital routes
    initialRoutes = RouteProvider.routes;
    // replace with the mock routes
    (RouteProvider.routes as object) = mockRouteProvider.routes;
  });

  afterAll(() => {
    // restore the initial routes
    (RouteProvider.routes as object) = initialRoutes;
  });

  const setMockExpectedParams = () => {
    const mockExpectedParams = new Map([
      [
        mockRouteProvider.routes.route1.name,
        {queries: ['route1'], filters: []},
      ],
      [
        mockRouteProvider.routes.route2.name,
        {queries: ['route1', 'route2'], filters: []},
      ],
      [
        mockRouteProvider.routes.route3.name,
        {queries: ['route1', 'route2', 'route3'], filters: []},
      ],
      [mockRouteProvider.routes.route4.name, {queries: [], filters: []}],
    ]);
    const getExpectedParams = (routeName: string) => {
      return mockExpectedParams.get(routeName);
    };
    spyOn(expectedParams, 'get').and.callFake(getExpectedParams);
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [BreadcrumbsComponent],
      imports: [MatIconModule, mockRoutingModule],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BreadcrumbsComponent);
    component = fixture.componentInstance;
    fixture.autoDetectChanges(true);
    router = TestBed.get(Router);
    ngZone = TestBed.get(NgZone);
    setMockExpectedParams();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not show the breadcrumbs on a page missing the required data', fakeAsync(() => {
    ngZone.run(() => {
      router.navigate([mockRouteProvider.routes.route1.testPath]);
      tick();

      expect(component.showCrumbs).toBeFalse();
    });
  }));

  it('should show the home breadcrumb on a page with empty data', fakeAsync(() => {
    ngZone.run(() => {
      router.navigate([mockRouteProvider.routes.route2.testPath]);
      tick();
      const crumbs = fixture.debugElement.queryAll(By.css('.crumb'));

      expect(crumbs.length).toEqual(1, 'There should be only one breadcrumb');

      const homeCrumb = crumbs[0].query(By.css('a'))
        .nativeElement as HTMLAnchorElement;
      expect(homeCrumb.getAttribute('routerLink')).toEqual(
        '/',
        'The only breadcrumb should link to the root page'
      );
    });
  }));

  it('should show the breadcrumbs on a dynamic page that has the required data', done => {
    ngZone.run(async () => {
      await router.navigate([mockRouteProvider.routes.route3.testPath]);
      await fixture.whenStable();

      const crumbsContainer = fixture.debugElement.query(
        By.css('#crumbs-container')
      );
      const crumbs = crumbsContainer.queryAll(By.css('div.crumb'));

      expect(crumbs.length).toEqual(4);

      const routeCrumbs = [];
      crumbs.forEach(crumb => {
        routeCrumbs.push(crumb.query(By.css('a')).nativeElement);
      });

      expect(routeCrumbs[0].getAttribute('href')).toEqual('/');
      routeCrumbs.shift();

      routeCrumbs.forEach((crumb, crumbIndex) => {
        Object.keys(mockRouteProvider.routes).forEach(
          (routeName, routeIndex) => {
            if (routeIndex === crumbIndex) {
              expect(crumb.getAttribute('href')).toEqual(
                '/' + mockRouteProvider.routes[routeName].testPath
              );
            }
          }
        );
      });
      done();
    });
  });

  it('should show the breadcrumbs on a static page that has the required data', done => {
    ngZone.run(async () => {
      await router.navigate([mockRouteProvider.routes.route4.testPath]);
      await fixture.whenStable();

      const crumbsContainer = fixture.debugElement.query(
        By.css('#crumbs-container')
      );
      const crumbs = crumbsContainer.queryAll(By.css('div.crumb'));

      expect(crumbs.length).toEqual(2);

      const homeCrumb = crumbs[0].query(By.css('a')).nativeElement;
      const route4Crumb = crumbs[1].query(By.css('a')).nativeElement;

      expect(homeCrumb.getAttribute('href')).toEqual('/');
      expect(route4Crumb.getAttribute('href')).toEqual(
        '/' + mockRouteProvider.routes.route4.testPath
      );
      done();
    });
  });

  it('should show the git link on a page with the required data', fakeAsync(() => {
    ngZone.run(() => {
      router.navigate([mockRouteProvider.routes.route4.testPath]);
      tick();

      fixture.detectChanges();
      tick();

      const gitCrumb = fixture.debugElement.query(
        By.css('#git-link-container')
      );

      expect(gitCrumb).not.toBeNull();
    });
  }));

  it('should hide the git link on a page missing the required data', fakeAsync(() => {
    ngZone.run(() => {
      router.navigate([mockRouteProvider.routes.route1.testPath]);
      tick();

      fixture.detectChanges();
      tick();

      const gitCrumb = fixture.debugElement.query(
        By.css('#git-link-container')
      );

      expect(gitCrumb).toBeNull();
    });
  }));
});
