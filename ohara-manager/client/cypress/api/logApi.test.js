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

/* eslint-disable no-unused-expressions */
// eslint is complaining about `expect(thing).to.be.undefined`

import * as logApi from '../../src/api/logApi';
import { createServices, deleteAllServices } from '../utils';

const generateCluster = async () => {
  const result = await createServices({
    withWorker: true,
    withBroker: true,
    withZookeeper: true,
    withNode: true,
  });
  return result;
};

describe('Log API', () => {
  beforeEach(() => deleteAllServices());

  it('fetchConfiguratorLog', async () => {
    const result = await logApi.getConfiguratorLog();
    const { clusterKey, logs } = result;

    expect(clusterKey).to.be.an('object');

    expect(logs).to.be.an('array');
  });

  it('fetchServiceLog', async () => {
    const { zookeeper, broker, worker } = await generateCluster();

    const logZookeeper = await logApi.getZookeeperLog(zookeeper);
    expect(logZookeeper.clusterKey.name).to.be.eq(zookeeper.name);
    expect(logZookeeper.clusterKey.group).to.be.eq(zookeeper.group);
    expect(logZookeeper.logs).to.be.an('array');

    const logBroker = await logApi.getBrokerLog(broker);
    expect(logBroker.clusterKey.name).to.be.eq(broker.name);
    expect(logBroker.clusterKey.group).to.be.eq(broker.group);
    expect(logBroker.logs).to.be.an('array');

    const logWorker = await logApi.getWorkerLog(worker);
    expect(logWorker.clusterKey.name).to.be.eq(worker.name);
    expect(logWorker.clusterKey.group).to.be.eq(worker.group);
    expect(logWorker.logs).to.be.an('array');

    //TODO : implement stream part in "Add stream API tests"
    // See https://github.com/oharastream/ohara/issues/3028
  });
});