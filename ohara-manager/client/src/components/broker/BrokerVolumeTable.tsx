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

import React, { useMemo, memo } from 'react';
import MaterialTable from 'material-table';
import { filter, some, map, isEmpty } from 'lodash';
import Box from '@material-ui/core/Box';
import Chip from '@material-ui/core/Chip';
import Typography from '@material-ui/core/Typography';
import StorageIcon from '@material-ui/icons/Storage';

import useBroker from 'hooks/useBroker';
import useVolumes from 'hooks/useVolumes';
import { Key, Volume } from 'types';

// Refetch every 5 seconds
const refetchInterval = 5000;

interface BrokerVolumeTableProps {
  brokerName: string;
}

const BrokerVolumeTable: React.FC<BrokerVolumeTableProps> = ({
  brokerName,
}) => {
  const { data: broker, isLoading: isBrokerLoading } = useBroker(brokerName);

  const { data: volumes, isLoading: isVolumesLoading } = useVolumes({
    refetchInterval,
  });

  const brokerVolumes: Volume[] = useMemo(() => {
    const logDirs = broker?.log__dirs as Key[];
    if (logDirs) {
      return filter(volumes, (volume: Volume) =>
        some(logDirs, { name: volume?.name as string }),
      );
    }
    return [];
  }, [broker, volumes]);

  if (isEmpty(brokerVolumes)) {
    return <div />;
  }

  return (
    <React.Fragment>
      <MaterialTable
        columns={[
          { title: 'Path', field: 'path' },
          {
            title: 'Nodes',
            render: (volume: Volume): JSX.Element[] => {
              return map(volume?.nodeNames, (nodeName: string) => (
                <Box display="inline" mx={0.5}>
                  <Chip
                    color="primary"
                    icon={<StorageIcon />}
                    label={nodeName}
                    size="small"
                    variant="outlined"
                  />
                </Box>
              ));
            },
          },
        ]}
        data={brokerVolumes}
        isLoading={isVolumesLoading || isBrokerLoading}
        options={{
          search: false,
          paging: brokerVolumes?.length > 5,
        }}
        title="Broker volumes"
      />
      <Box mt={0.5}>
        <Typography
          color="textSecondary"
          display="block"
          gutterBottom
          variant="caption"
        >
          The volume nodes will be dynamically added with the broker nodes.
        </Typography>
      </Box>
    </React.Fragment>
  );
};

export default memo(BrokerVolumeTable);
