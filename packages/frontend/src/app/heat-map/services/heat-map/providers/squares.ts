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

import {Scales, BuildBatch, moment} from '../../interfaces';
import {EventEmitter} from '@angular/core';

export class SquaresProvider {
  setSquares(
    batches,
    svg,
    colorsScale,
    tooltipHandlers: TooltipHandlers,
    scales: Scales
  ): EventEmitter<BuildBatch> {
    const batchClicked = new EventEmitter();
    svg
      .selectAll()
      .data(batches)
      .enter()
      .append('rect')
      .attr('x', batch => scales.x(batch['x']))
      .attr('y', batch => scales.y(batch['y']))
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('width', scales.x.bandwidth())
      .attr('height', scales.y.bandwidth())
      .style('fill', batch => colorsScale(batch['health']))
      .style('opacity', 0.9)
      .style('visibility', batch => {
        const today = moment().endOf('day');
        return batch.moment.isAfter(today) ? 'hidden' : 'visible';
      })
      .on('mouseover', tooltipHandlers.mouseOver)
      .on('mousemove', tooltipHandlers.mouseMove)
      .on('mouseleave', tooltipHandlers.mouseLeave)
      .on('click', batch => batchClicked.emit(batch));
    return batchClicked;
  }
}

export interface TooltipHandlers {
  mouseOver: Function;
  mouseMove: Function;
  mouseLeave: Function;
}
