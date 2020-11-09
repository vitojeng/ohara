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

import React, { useMemo } from 'react';
import { filter, includes, map } from 'lodash';
import { Form, FormRenderProps } from 'react-final-form';
import { Select } from 'mui-rff';
import MenuItem from '@material-ui/core/MenuItem';

import { Dialog } from 'components/common/Dialog';
import useBroker from 'hooks/useBroker';
import useNodes from 'hooks/useNodes';
import useAddBrokerNode from 'hooks/useAddBrokerNode';
import { Node } from 'types';

interface AddBrokerNodeDialogProps {
  brokerName: string;
  open: boolean;
  onClose: () => void;
}

export interface FormData {
  nodeName: string;
}

const AddBrokerNodeDialog: React.FC<AddBrokerNodeDialogProps> = ({
  open,
  onClose,
  brokerName,
}) => {
  const { data: broker, isLoading: isBrokerLoading } = useBroker(brokerName);
  const { data: nodes, isLoading: isNodesLoading } = useNodes();
  const [addBrokerNode] = useAddBrokerNode();

  const nodesToBeSelected: Node[] = useMemo(() => {
    if (broker?.nodeNames) {
      return filter(
        nodes,
        (node) => !includes(broker.nodeNames, node.hostname),
      );
    }
    return [];
  }, [broker, nodes]);

  const hasNodesToBeSelected = nodesToBeSelected?.length > 0 || false;

  async function handleSubmit(values: FormData): Promise<void> {
    const { nodeName } = values;
    if (broker) {
      await addBrokerNode({ name: broker.name as string, nodeName });
    }
    onClose();
  }

  return (
    <Form
      initialValues={{}}
      onSubmit={handleSubmit}
      render={(props: FormRenderProps<FormData>): React.ReactNode => (
        <Dialog
          confirmDisabled={props.invalid || props.pristine || props.submitting}
          loading={isBrokerLoading || isNodesLoading}
          onClose={onClose}
          onConfirm={props.handleSubmit}
          open={open}
          title="Add broker node"
        >
          <Select
            disabled={!hasNodesToBeSelected}
            formControlProps={{ margin: 'normal' }}
            label="Select a Node"
            name="nodeName"
          >
            {map(
              nodesToBeSelected,
              (node: Node): JSX.Element => {
                return (
                  <MenuItem value={node.hostname}>{node.hostname}</MenuItem>
                );
              },
            )}
          </Select>
        </Dialog>
      )}
    />
  );
};

export default AddBrokerNodeDialog;
