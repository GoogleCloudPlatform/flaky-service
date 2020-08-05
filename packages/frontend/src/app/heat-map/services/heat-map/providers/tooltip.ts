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

import {BuildBatch} from '../../interfaces';
import * as d3 from 'd3';

export class TooltipProvider {
  getTooltip() {
    return d3
      .select('#data-holder')
      .insert('div', ':first-child')
      .attr('class', 'tooltip')
      .style('position', 'absolute')
      .style('background-color', '#555')
      .style('color', 'white')
      .style('border-radius', '5px')
      .style('font-size', '0.8em')
      .style('height', '20px')
      .style('padding-left', '2px')
      .style('padding-right', '2px')
      .style('white-space', 'nowrap')
      .style('visibility', 'hidden');
  }

  getTooltipHandlers(tooltip) {
    const mouseOver = function () {
      tooltip.style('visibility', 'visible');
      d3.select(this).style('stroke', 'black').style('opacity', 1);
    };

    const setToolTipHtml = this.setToolTipHtml;
    const mouseMove = function (batch) {
      let xPos = 0,
        yPos = 0;
      try {
        (xPos = d3.mouse(this)[0] - 30), (yPos = d3.mouse(this)[1] - 10);
      } catch {
        /*The mouse event was raised programmatically*/
      }
      setToolTipHtml(tooltip, xPos, yPos, batch);
    };

    const mouseLeave = function () {
      tooltip.style('visibility', 'hidden');
      d3.select(this).style('stroke', 'none').style('opacity', 0.9);
    };
    return {mouseOver, mouseMove, mouseLeave};
  }

  setToolTipHtml(tooltip, xPos, yPos, batch: BuildBatch) {
    let tooltipTemplate = '';
    if (batch.failingBuilds)
      tooltipTemplate += ' <span>' + batch.failingBuilds + ' failing</span>';
    if (batch.flakyBuilds)
      tooltipTemplate += ' <span>' + batch.flakyBuilds + ' flaky</span>';
    if (batch.passedBuilds && !batch.failingBuilds && !batch.flakyBuilds)
      tooltipTemplate += '<span>' + batch.passedBuilds + ' passing</span>';
    if (!tooltipTemplate) tooltipTemplate = 'No build';

    tooltipTemplate += ' on ' + batch.moment.format('MMM D, YYYY');

    tooltip
      .html(tooltipTemplate)
      .style('left', xPos + 'px')
      .style('top', yPos + 'px');
  }
}
