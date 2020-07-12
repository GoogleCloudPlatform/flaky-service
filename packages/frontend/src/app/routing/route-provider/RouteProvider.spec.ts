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

import {RouteProvider} from './RouteProvider';

describe('RouteProvider', () => {
  const getLinkArgs = (argsCount: number) => {
    const args = [];
    let argsString = '';

    for (let index = 0; index < argsCount; index++) {
      const arg = 'arg' + index;
      args.push(arg);
      argsString += '/' + arg;
    }
    return {args, argsString};
  };

  it('should return a route link corresponding to the provided parameters', () => {
    Object.keys(RouteProvider.routes).forEach(route => {
      const routeLinkProvider: Function = RouteProvider.routes[route].link;
      const {args, argsString} = getLinkArgs(routeLinkProvider.length);
      const link = routeLinkProvider.apply(this, args);

      expect(link).toContain(argsString);
    });
  });
});
