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

import {Build} from 'src/app/services/search/interfaces';
import * as d3 from 'd3';
import * as moment from 'moment';
export {Build};
export {moment};

export enum BuildHealth {
  failing = 0,
  flaky = 1,
  passing = 2,
  none = 3,
}

export interface Margins {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface Scales {
  x: d3.ScaleBand<string>;
  y: d3.ScaleBand<string>;
}

export interface BuildBatch {
  builds: Build[];
  moment?: moment.Moment;
  failingBuilds?: number;
  flakyBuilds?: number;
  passedBuilds?: number;
  timestamp?: number;
  isDefault?: boolean;
}

const d3Select = d3.select('div');
export type D3Selection = typeof d3Select;

export interface Congifuration {
  width?: number;
  height?: number;
  margins?: Margins;
  weeksToDisplay?: number;
  daysToDisplay?: number;
  xDomain?: string[];
  yDomain?: string[];
  svg?: D3Selection;
  scales?: Scales;
  tooltip?: D3Selection;
  colorsScale?: d3.ScaleLinear<number, number>;
}
