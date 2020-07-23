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

import {Injectable, EventEmitter} from '@angular/core';
import * as d3 from 'd3';
import {Congifuration, BuildBatch} from '../interfaces';
import {DomainsProvider} from './providers/domains';
import {ScalesProvider} from './providers/scales';
import {TooltipProvider} from './providers/tooltip';
import {BatchesProvider} from './providers/batches';
import {ColorsProvider} from './providers/colors';
import {SquaresProvider} from './providers/squares';
export {Congifuration};

@Injectable({
  providedIn: 'root',
})
export class HeatMapService {
  config: Congifuration;
  batches: BuildBatch[];
  svgSelector = 'heat-map-svg';

  providers: Providers = {
    domain: new DomainsProvider(),
    scales: new ScalesProvider(),
    tooltip: new TooltipProvider(),
    batches: new BatchesProvider(),
    colors: new ColorsProvider(),
    squares: new SquaresProvider(),
  };

  public draw(
    config: Congifuration,
    batches: BuildBatch[],
    selector: string
  ): EventEmitter<BuildBatch> {
    this.clearMap();
    this.setConfig(config, batches, selector);
    return this.setSquares();
  }

  private clearMap() {
    d3.select('svg' + '.' + this.svgSelector).remove();
    this.config?.tooltip?.remove();
  }

  private copyConfig(config: Congifuration) {
    this.config = {};
    Object.assign(this.config, config);
  }

  private setConfig(
    config: Congifuration,
    batches: BuildBatch[],
    selector: string
  ) {
    this.copyConfig(config);
    this.applyMargins();
    this.setSvg(selector);
    this.setDomains();
    this.setUpBatches(batches);
    this.setScales();
    this.setColors();
    this.setTooltip();
  }

  private applyMargins() {
    const config = this.config;
    config.width = config.width - config.margins.left - config.margins.right;
    config.height = config.height - config.margins.top - config.margins.bottom;
  }

  private setSvg(selector: string) {
    this.config.svg = d3
      .select(selector)
      .append('svg')
      .attr('class', this.svgSelector)
      .attr(
        'width',
        this.config.width + this.config.margins.left + this.config.margins.right
      )
      .attr(
        'height',
        this.config.height +
          this.config.margins.top +
          this.config.margins.bottom
      )
      .append('g')
      .attr(
        'transform',
        'translate(' +
          this.config.margins.left +
          ',' +
          this.config.margins.top +
          ')'
      );
  }

  private setDomains() {
    const {xDomain, yDomain} = this.providers.domain.getDomains(
      this.config.weeksToDisplay,
      this.config.daysToDisplay
    );
    this.config.xDomain = xDomain;
    this.config.yDomain = yDomain;
  }

  private setUpBatches(batches: BuildBatch[]) {
    const config = this.config;
    this.batches = this.providers.batches.setUpBatches(
      batches,
      config.weeksToDisplay,
      config.daysToDisplay
    );
  }

  private setTooltip() {
    this.config.tooltip = this.providers.tooltip.getTooltip();
  }

  private setScales() {
    const config = this.config;
    const scalesProvider = this.providers.scales;

    const xScale = scalesProvider.getXScale(config.width, config.xDomain);
    const yScale = scalesProvider.getYScale(config.height, config.yDomain);

    this.config.scales = {x: xScale, y: yScale};

    scalesProvider.addXScale(
      config.svg,
      config.weeksToDisplay,
      config.scales,
      config.margins
    );
    scalesProvider.addYScale(config.svg, config.scales);
  }

  private setColors() {
    this.config.colorsScale = this.providers.colors.getColors();
  }

  private setSquares(): EventEmitter<BuildBatch> {
    return this.providers.squares.setSquares(
      this.batches,
      this.config.svg,
      this.config.colorsScale,
      this.providers.tooltip.getTooltipHandlers(this.config.tooltip),
      this.config.scales
    );
  }
}

interface Providers {
  domain: DomainsProvider;
  scales: ScalesProvider;
  tooltip: TooltipProvider;
  batches: BatchesProvider;
  colors: ColorsProvider;
  squares: SquaresProvider;
}
