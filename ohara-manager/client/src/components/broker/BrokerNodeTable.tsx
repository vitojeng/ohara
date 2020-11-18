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

/* eslint-disable @typescript-eslint/no-floating-promises */
import React, { useMemo, memo } from 'react';
import MaterialTable from 'material-table';
import { filter, includes, map, isArray } from 'lodash';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';

import useBroker from 'hooks/useBroker';
import useNodes from 'hooks/useNodes';
import { Node } from 'types';
import ResourceBarChart from 'components/common/ResourceBarChart';
import NodeStateChip from 'components/Node/NodeStateChip';
import { getServiceCountOfNode } from 'utils/nodeUtils';

// Refetch every 5 seconds
const refetchInterval = 5000;

interface BrokerNodeTableProps {
  brokerName: string;
  onAddIconClick?: () => void;
  onColumnClick?: (node: Node, columnName: string) => void;
  onViewIconClick?: (node: Node) => void;
}

const BrokerNodeTable: React.FC<BrokerNodeTableProps> = ({
  brokerName,
  onAddIconClick,
  onColumnClick,
  onViewIconClick,
}) => {
  const {
    data: broker,
    isLoading: isBrokerLoading,
    refetch: refetchBroker,
  } = useBroker(brokerName);

  const {
    data: nodes,
    isLoading: isNodesLoading,
    refetch: refetchNodes,
  } = useNodes({ refetchInterval });

  const brokerNodes: Node[] = useMemo(() => {
    if (broker?.nodeNames) {
      return filter(nodes, (node) => includes(broker.nodeNames, node.hostname));
    }
    return [];
  }, [broker, nodes]);

  return (
    <React.Fragment>
      <MaterialTable
        actions={[
          {
            icon: 'refresh',
            tooltip: 'Refresh',
            isFreeAction: true,
            onClick: (): void => {
              refetchBroker();
              refetchNodes();
            },
          },
          {
            icon: 'add',
            tooltip: 'Add node',
            isFreeAction: true,
            onClick: (): void => {
              if (onAddIconClick) {
                onAddIconClick();
              }
            },
          },
          {
            icon: 'visibility',
            tooltip: 'View node',
            iconProps: {
              color: 'action',
            },
            onClick: (_, data: Node | Node[]): void => {
              if (onViewIconClick) {
                if (isArray(data)) {
                  onViewIconClick(data[0]);
                } else {
                  onViewIconClick(data);
                }
              }
            },
          },
        ]}
        columns={[
          { title: 'Name', field: 'hostname' },
          {
            title: 'Resources',
            render: (node: Node): JSX.Element[] => {
              return map(node.resources, (resource) => (
                <ResourceBarChart resource={resource} />
              ));
            },
          },
          {
            title: 'Services',
            render: (node: Node): JSX.Element => {
              const count = getServiceCountOfNode(node);
              return (
                <Tooltip title="View services">
                  <Button
                    color="primary"
                    component="div"
                    disabled={!(count > 0)}
                    onClick={(): void => {
                      if (onColumnClick) {
                        onColumnClick(node, 'services');
                      }
                    }}
                  >
                    {count}
                  </Button>
                </Tooltip>
              );
            },
          },
          {
            title: 'State',
            field: 'state',
            render: (node: Node): JSX.Element => <NodeStateChip node={node} />,
          },
        ]}
        data={brokerNodes}
        isLoading={isNodesLoading || isBrokerLoading}
        options={{
          actionsColumnIndex: -1,
          search: false,
          paging: brokerNodes?.length > 5,
        }}
        title="Broker nodes"
      />
      <Box mt={0.5}>
        <Typography
          color="textSecondary"
          display="block"
          gutterBottom
          variant="caption"
        >
          The nodes hosting the broker cluster.
        </Typography>
      </Box>
    </React.Fragment>
  );
};

export default memo(BrokerNodeTable);
