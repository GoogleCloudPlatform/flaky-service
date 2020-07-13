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

import {Component, OnInit} from '@angular/core';
import {Router, NavigationEnd, ActivatedRoute} from '@angular/router';
import {filter} from 'rxjs/operators';
import {
  InterpretationService,
  expectedParams,
} from 'src/app/services/interpretation/interpretation.service';
import {
  RouteProvider,
  RouteData,
} from '../routing/route-provider/RouteProvider';

@Component({
  selector: 'app-breadcrumbs',
  templateUrl: './breadcrumbs.component.html',
  styleUrls: ['./breadcrumbs.component.css'],
})
export class BreadcrumbsComponent implements OnInit {
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private interpreter: InterpretationService
  ) {}

  crumbs: Crumb[] = [];
  showCrumbs = true;

  ngOnInit(): void {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => this.updateCrumbs());
  }

  private updateCrumbs() {
    const route = this.route.root.firstChild.snapshot;
    const paths = route.data.breadCrumbPaths;
    this.showCrumbs = paths !== undefined;

    if (paths) {
      this.crumbs = this.getCrumbs(paths);
    }
  }

  private getCrumbs(paths: string[]) {
    const crumbs: Crumb[] = [];

    paths.forEach(routeName => {
      Object.keys(RouteProvider.routes).forEach(routeKey => {
        const route = RouteProvider.routes[routeKey] as RouteData;

        if (route.name === routeName) {
          const {paramsValues, lastParam} = this.getParamsValues(
            routeName,
            route.path
          );
          const routePath: string = route.link.apply(this, paramsValues);

          crumbs.push({
            name: lastParam,
            path: routePath,
          });
        }
      });
    });
    return crumbs;
  }

  private getParamsValues(routeName: string, path: string) {
    // [':param1',...]
    const paramsNamesWithColons = path.match(this.getParamsRegExp());

    // [':param1',] => ['param1',]
    const paramsNames = [];
    paramsNamesWithColons.forEach(param => {
      paramsNames.push(param.substring(1, param.length));
    });

    // ['param1',] => ['value1',]
    const foundParams = this.extractParams(routeName);
    const paramsValues = [];
    paramsNames.forEach(param => {
      paramsValues.push(foundParams.queries.get(param));
    });

    let lastParam = '';
    if (paramsValues.length) lastParam = paramsValues[paramsValues.length - 1];

    return {paramsValues, lastParam};
  }

  private getParamsRegExp(): RegExp {
    return /:(([a-z]|[0-9])*)/gm;
  }

  private extractParams(routeName: string) {
    const route = this.route.root.firstChild.snapshot;
    const foundParams = this.interpreter.parseRouteParam(
      route.params,
      expectedParams.get(routeName)
    );
    return foundParams;
  }
}

interface Crumb {
  name: string;
  path: string;
}
