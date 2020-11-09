/*
 * Copyright 2019 is-land
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React from 'react';
import { round } from 'lodash';

import LinearProgress from '@material-ui/core/LinearProgress';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';
import { Resource } from 'types';

interface ResourceBarChartProps {
  resource: Resource;
}

const ResourceBarChart: React.FC<ResourceBarChartProps> = (props) => {
  const { resource } = props;
  const { name, unit, used = 0, value } = resource;
  const valueText = `${round(value, 1).toString()} ${unit}`;
  const usedText = `${round(used * 100, 1).toString()} %`;
  const tooltipTitle = `${name} ${valueText} | Used ${usedText}`;

  return (
    <>
      <Tooltip title={tooltipTitle}>
        <Typography variant="subtitle2">{valueText}</Typography>
      </Tooltip>
      <Tooltip title={tooltipTitle}>
        <LinearProgress
          color={used > 0.8 ? 'secondary' : 'primary'}
          value={used * 100}
          variant="determinate"
        />
      </Tooltip>
    </>
  );
};

export default ResourceBarChart;
