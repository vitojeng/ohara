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

import { useRef, forwardRef } from 'react';

import PropTypes from 'prop-types';
import MaterialTable from 'material-table';
import AddBox from '@material-ui/icons/AddBox';
import ArrowDownward from '@material-ui/icons/ArrowDownward';
import Check from '@material-ui/icons/Check';
import ChevronLeft from '@material-ui/icons/ChevronLeft';
import ChevronRight from '@material-ui/icons/ChevronRight';
import Clear from '@material-ui/icons/Clear';
import DeleteOutline from '@material-ui/icons/DeleteOutline';
import Edit from '@material-ui/icons/Edit';
import FilterList from '@material-ui/icons/FilterList';
import FirstPage from '@material-ui/icons/FirstPage';
import LastPage from '@material-ui/icons/LastPage';
import Remove from '@material-ui/icons/Remove';
import SaveAlt from '@material-ui/icons/SaveAlt';
import Search from '@material-ui/icons/Search';
import ViewColumn from '@material-ui/icons/ViewColumn';
import FormHelperText from '@material-ui/core/FormHelperText';

import { useShowMessage } from 'hooks';

const tableIcons = {
  Add: forwardRef((props, ref) => <AddBox {...props} ref={ref} />),
  Check: forwardRef((props, ref) => <Check {...props} ref={ref} />),
  Clear: forwardRef((props, ref) => <Clear {...props} ref={ref} />),
  Delete: forwardRef((props, ref) => <DeleteOutline {...props} ref={ref} />),
  DetailPanel: forwardRef((props, ref) => (
    <ChevronRight {...props} ref={ref} />
  )),
  Edit: forwardRef((props, ref) => <Edit {...props} ref={ref} />),
  Export: forwardRef((props, ref) => <SaveAlt {...props} ref={ref} />),
  Filter: forwardRef((props, ref) => <FilterList {...props} ref={ref} />),
  FirstPage: forwardRef((props, ref) => <FirstPage {...props} ref={ref} />),
  LastPage: forwardRef((props, ref) => <LastPage {...props} ref={ref} />),
  NextPage: forwardRef((props, ref) => <ChevronRight {...props} ref={ref} />),
  PreviousPage: forwardRef((props, ref) => (
    <ChevronLeft {...props} ref={ref} />
  )),
  ResetSearch: forwardRef((props, ref) => <Clear {...props} ref={ref} />),
  Search: forwardRef((props, ref) => <Search {...props} ref={ref} />),
  SortArrow: forwardRef((props, ref) => <ArrowDownward {...props} ref={ref} />),
  ThirdStateCheck: forwardRef((props, ref) => <Remove {...props} ref={ref} />),
  ViewColumn: forwardRef((props, ref) => <ViewColumn {...props} ref={ref} />),
};

const Table = (props) => {
  const {
    input: { name, onChange, value = [] },
    meta = {},
    helperText,
    label,
    tableKeys,
    refs,
  } = props;

  const stateRef = useRef({});
  const showMessage = useShowMessage();

  stateRef.current = {
    columns: tableKeys.map((tableKey) => {
      const { name, type, recommendedValues } = tableKey;
      const dataTypes = getDataTypes(recommendedValues);

      return {
        title: name,
        field: name,
        type: getType(type),
        align: 'left',
        editPlaceholder: getPlaceholder(name),
        disabled: true,
        validate: (rowData) => getValidateFunction(rowData, name, value),
        headerStyle: { whiteSpace: 'noWrap', textAlign: 'left' },
        ...(recommendedValues.length > 0 && {
          lookup: dataTypes,
          initialEditValue: dataTypes[Object.keys(dataTypes)[0]],
        }),
      };
    }),
    data: [...value],
  };

  const hasError = (meta.error && meta.touched) || (meta.error && meta.dirty);
  return (
    <div data-testid="definition-table" ref={refs}>
      <MaterialTable
        columns={stateRef.current.columns}
        data={stateRef.current.data}
        editable={{
          onRowAdd: (newData) =>
            new Promise((resolve, reject) => {
              if (Object.keys(newData).length < tableKeys.length) {
                showMessage('All fields are required');
                return reject(); // Prevents users from submitting the new item
              }

              const newRow = () => {
                const data = [...stateRef.current.data];
                data.push(newData);
                return data;
              };

              stateRef.current.data = newRow();
              onChange(stateRef.current.data);
              resolve();
            }),

          onRowUpdate: (newData, oldData) =>
            new Promise((resolve) => {
              if (oldData) {
                const newRow = () => {
                  const data = [...stateRef.current.data];
                  data[data.indexOf(oldData)] = newData;
                  return data;
                };
                stateRef.current.data = newRow();
                onChange(stateRef.current.data);
              }
              resolve();
            }),

          onRowDelete: (oldData) =>
            new Promise((resolve) => {
              const newRow = () => {
                const data = [...stateRef.current.data];
                data.splice(data.indexOf(oldData), 1);
                return data;
              };
              stateRef.current.data = newRow();
              onChange(stateRef.current.data);
              resolve();
            }),
        }}
        icons={tableIcons}
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

function getType(type) {
  switch (type) {
    case 'number':
      return 'numeric';
    default:
      return 'string';
  }
}

function getDataTypes(recommendedValues) {
  return recommendedValues.reduce((result, dataType) => {
    result[dataType] = dataType;
    return result;
  }, {});
}

function getPlaceholder(name) {
  if (name === 'order') return '1';
  if (name === 'name' || name === 'newName') return name;
}

function getValidateFunction(rowData, name, values) {
  if (name === 'name' || name === 'newName') {
    return rowData[name] === ''
      ? { isValid: false, helperText: 'Field is required' }
      : true;
  }

  if (name === 'order') {
    const currentOrder = rowData.order;
    const isOrderExist = values
      // When updating a cell, the current value should be exclude from the validation list
      // or it will be treated as invalid since the "order is taken"
      .filter((value) => value.tableData?.editing !== 'update')
      .some((value) => value.order === currentOrder);

    const isDelete = rowData.tableData?.editing === 'delete';

    if (currentOrder <= 0) {
      return { isValid: false, helperText: 'Order starts from 1' };
    }

    if (isOrderExist && !isDelete) {
      return { isValid: false, helperText: 'Order is taken' };
    }

    // A true should be returned in order to make the validation passed
    return true;
  }

  // Same here
  return true;
}

Table.propTypes = {
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
  tableKeys: PropTypes.array,
  refs: PropTypes.object,
};
Table.defaultProps = {
  helperText: '',
};

export default Table;
