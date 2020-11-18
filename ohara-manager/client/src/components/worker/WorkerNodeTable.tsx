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
import Button from '@material-ui/core/Button';
import Tooltip from '@material-ui/core/Tooltip';

import useWorker from 'hooks/useWorker';
import useNodes from 'hooks/useNodes';
import { Node } from 'types';
import ResourceBarChart from 'components/common/ResourceBarChart';
import NodeStateChip from 'components/Node/NodeStateChip';
import { getServiceCountOfNode } from 'utils/nodeUtils';

// Refetch every 5 seconds
const refetchInterval = 5000;

interface WorkerNodeTableProps {
  name: string;
  onAddIconClick?: () => void;
  onColumnClick?: (node: Node, columnName: string) => void;
  onViewIconClick?: (node: Node) => void;
}

const WorkerNodeTable: React.FC<WorkerNodeTableProps> = (props) => {
  const {
    data: worker,
    isLoading: isWorkerLoading,
    refetch: refetchWorker,
  } = useWorker(props.name);

  const {
    data: nodes,
    isLoading: isNodesLoading,
    refetch: refetchNodes,
  } = useNodes({ refetchInterval });

  const workerNodes: Node[] = useMemo(() => {
    if (worker?.nodeNames) {
      return filter(nodes, (node) => includes(worker.nodeNames, node.hostname));
    }
    return [];
  }, [worker, nodes]);

  return (
    <MaterialTable
      actions={[
        {
          icon: 'refresh',
          tooltip: 'Refresh',
          isFreeAction: true,
          onClick: (): void => {
            refetchWorker();
            refetchNodes();
          },
        },
        {
          icon: 'add',
          tooltip: 'Add node',
          isFreeAction: true,
          onClick: (): void => {
            if (props.onAddIconClick) {
              props.onAddIconClick();
            }
          },
        },
        {
          icon: 'visibility',
          iconProps: {
            color: 'action',
          },
          tooltip: 'View node',
          onClick: (_, data: Node | Node[]): void => {
            if (props.onViewIconClick) {
              if (isArray(data)) {
                props.onViewIconClick(data[0]);
              } else {
                props.onViewIconClick(data);
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
                    if (props.onColumnClick) {
                      props.onColumnClick(node, 'services');
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
      data={workerNodes}
      isLoading={isNodesLoading || isWorkerLoading}
      options={{
        actionsColumnIndex: -1,
        search: false,
        paging: workerNodes?.length > 5,
      }}
      title="Worker nodes"
    />
  );
};

export default memo(WorkerNodeTable);
