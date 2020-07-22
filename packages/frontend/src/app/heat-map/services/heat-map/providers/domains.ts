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

import {moment} from '../../interfaces';

export class DomainsProvider {
  getDomains(weeksToDisplay: number, daysToDisplay: number) {
    const xDomain = [],
      yDomain = [];
    const domainMoment = moment()
      .utc()
      .subtract(weeksToDisplay - 1, 'weeks');
    domainMoment.day(0);

    for (let xDomainIndex = 0; xDomainIndex < weeksToDisplay; xDomainIndex++) {
      xDomain.push(xDomainIndex);
      domainMoment.add(1, 'week');
    }

    domainMoment.day(6);

    for (let yDomainIndex = 0; yDomainIndex < daysToDisplay; yDomainIndex++) {
      yDomain.push(domainMoment.day().toString());
      domainMoment.subtract(1, 'day');
    }
    return {xDomain, yDomain};
  }
}
