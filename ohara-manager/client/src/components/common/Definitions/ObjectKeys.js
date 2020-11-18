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

import { useState } from 'react';

import PropTypes from 'prop-types';
import MaterialTable from 'material-table';
import FormHelperText from '@material-ui/core/FormHelperText';

const ObjectKeys = (props) => {
  const {
    input: { name, onChange, value = [] },
    meta = {},
    helperText,
    label,
    refs,
  } = props;
  const [state, setState] = useState({
    columns: [
      {
        title: 'name',
        field: 'name',
        type: 'string',
      },
      {
        title: 'group',
        field: 'group',
        type: 'string',
      },
    ],
    data: [...value],
  });

  // This currently throws some warnings in browser's console.
  // We need to wait for the update: https://github.com/mbrn/material-table/issues/1293
  const hasError = (meta.error && meta.touched) || (meta.error && meta.dirty);
  return (
    <div ref={refs}>
      <MaterialTable
        columns={state.columns}
        data={state.data}
        editable={{
          onRowAdd: (newData) =>
            new Promise((resolve) => {
              setTimeout(() => {
                resolve();
                setState((prevState) => {
                  const data = [...prevState.data];
                  data.push(newData);
                  onChange(data);
                  return { ...prevState, data };
                });
              }, 600);
            }),
          onRowUpdate: (newData, oldData) =>
            new Promise((resolve) => {
              setTimeout(() => {
                resolve();
                if (oldData) {
                  setState((prevState) => {
                    const data = [...prevState.data];
                    data[data.indexOf(oldData)] = newData;
                    onChange(data);
                    return { ...prevState, data };
                  });
                }
              }, 600);
            }),
          onRowDelete: (oldData) =>
            new Promise((resolve) => {
              setTimeout(() => {
                resolve();
                setState((prevState) => {
                  const data = [...prevState.data];
                  data.splice(data.indexOf(oldData), 1);
                  onChange(data);
                  return { ...prevState, data };
                });
              }, 600);
            }),
        }}
        name={name}
        options={{
          paging: false,
          draggable: false,
        }}
        title={label}
      />
      <FormHelperText children={hasError ? meta.error : helperText} />
    </div>
  );
};

ObjectKeys.propTypes = {
  input: PropTypes.shape({
    name: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    value: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.object,
      PropTypes.array,
    ]).isRequired,
  }).isRequired,
  meta: PropTypes.shape({
    dirty: PropTypes.bool,
    touched: PropTypes.bool,
    error: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  }),
  helperText: PropTypes.string,
  label: PropTypes.string,
  refs: PropTypes.object,
};
ObjectKeys.defaultProps = {
  helperText: '',
};

export default ObjectKeys;
