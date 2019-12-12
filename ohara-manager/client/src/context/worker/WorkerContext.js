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
import PropTypes from 'prop-types';
import { useSnackbar } from 'context/SnackbarContext';
import {
  fetchWorkersCreator,
  addWorkerCreator,
  updateWorkerCreator,
  deleteWorkerCreator,
  updateStagingSettingsCreator,
} from './workerActions';
import { reducer, initialState } from './workerReducer';

const WorkerStateContext = React.createContext();
const WorkerDispatchContext = React.createContext();

const WorkerProvider = ({ children }) => {
  const [state, dispatch] = React.useReducer(reducer, initialState);
  const showMessage = useSnackbar();

  const fetchWorkers = React.useCallback(
    fetchWorkersCreator(state, dispatch, showMessage),
    [state],
  );

  React.useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  return (
    <WorkerStateContext.Provider value={state}>
      <WorkerDispatchContext.Provider value={dispatch}>
        {children}
      </WorkerDispatchContext.Provider>
    </WorkerStateContext.Provider>
  );
};

WorkerProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

const useWorkerState = () => {
  const context = React.useContext(WorkerStateContext);
  if (context === undefined) {
    throw new Error('useWorkerState must be used within a WorkerProvider');
  }
  return context;
};

const useWorkerDispatch = () => {
  const context = React.useContext(WorkerDispatchContext);
  if (context === undefined) {
    throw new Error('useWorkerDispatch must be used within a WorkerProvider');
  }
  return context;
};

const useWorkerActions = () => {
  const state = useWorkerState();
  const dispatch = useWorkerDispatch();
  const showMessage = useSnackbar();
  return {
    addWorker: addWorkerCreator(state, dispatch, showMessage),
    updateWorker: updateWorkerCreator(state, dispatch, showMessage),
    deleteWorker: deleteWorkerCreator(state, dispatch, showMessage),
    updateStagingSettings: updateStagingSettingsCreator(
      state,
      dispatch,
      showMessage,
    ),
  };
};

export { WorkerProvider, useWorkerState, useWorkerDispatch, useWorkerActions };