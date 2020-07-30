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

import {D3Selection, Margins, moment, Scales} from '../../interfaces';
import * as d3 from 'd3';

export class ScalesProvider {
  getXScale(width: number, xDomain) {
    return d3.scaleBand().range([0, width]).domain(xDomain).padding(0.05);
  }

  getYScale(height: number, yDomain) {
    return d3.scaleBand().range([height, 0]).domain(yDomain).padding(0.05);
  }

  addXScale(
    svg: D3Selection,
    weeksToDisplay: number,
    scales: Scales,
    margins: Margins
  ) {
    let labeledMonth = undefined;
    svg
      .append('g')
      .attr('transform', 'translate(0,-' + margins.top + ')')
      .call(
        d3
          .axisBottom(scales.x)
          .tickFormat(index => {
            const month = moment()
              .utc()
              .subtract(weeksToDisplay - 1, 'weeks')
              .add(index, 'weeks')
              .format('MMM');
            // skip a month if it has been marked
            if (labeledMonth === month) return null;
            // skip the first month
            else if (labeledMonth === undefined) {
              labeledMonth = '';
              return null;
            } else {
              labeledMonth = month;
            }
            return month;
          })
          .tickSizeInner(0)
      )
      .select('.domain')
      .remove();
  }

  addYScale(svg: D3Selection, scales: Scales) {
    svg
      .append('g')
      .call(
        d3
          .axisLeft(scales.y)
          .tickFormat(day => {
            return +day % 2 ? moment.weekdaysMin(+day) : null;
          })
          .tickSizeInner(0)
      )
      .select('.domain')
      .remove();
  }
}
