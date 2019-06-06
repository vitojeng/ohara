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

package com.island.ohara.agent
import com.island.ohara.client.configurator.v0.BrokerApi.BrokerClusterInfo
import com.island.ohara.client.configurator.v0.ContainerApi.ContainerInfo
import com.island.ohara.client.configurator.v0.ZookeeperApi.ZookeeperClusterInfo
import com.island.ohara.client.configurator.v0.{BrokerApi, ClusterInfo, ContainerApi, NodeApi}

import scala.concurrent.{ExecutionContext, Future}

class FakeBrokerCollie(zkContainers: Seq[ContainerInfo], bkExistContainers: Seq[ContainerInfo]) extends BrokerCollie {
  override protected def zookeeperClusters(
    implicit executionContext: ExecutionContext): Future[Map[ClusterInfo, Seq[ContainerInfo]]] = {
    Future {
      Map(
        ZookeeperClusterInfo("zk1", "zookeeper", 2181, 2182, 2183, Seq("node1")) -> zkContainers,
      )

    }
  }

  override protected def doCreator(executionContext: ExecutionContext,
                                   clusterName: String,
                                   containerName: String,
                                   containerInfo: ContainerApi.ContainerInfo,
                                   node: NodeApi.Node,
                                   route: Map[String, String]): Unit = {
    // Nothing
  }

  override def remove(clusterName: String)(implicit executionContext: ExecutionContext): Future[Boolean] =
    throw new UnsupportedOperationException("Not support remove function")

  override def logs(clusterName: String)(
    implicit executionContext: ExecutionContext): Future[Map[ContainerInfo, String]] =
    throw new UnsupportedOperationException("Not support logs function")

  override def creator(): BrokerCollie.ClusterCreator =
    throw new UnsupportedOperationException("Not support creator function")

  override def clusters(
    implicit executionContext: ExecutionContext): Future[Map[BrokerClusterInfo, Seq[ContainerInfo]]] = {
    Future {
      //Pre create broker container for test
      Map(BrokerClusterInfo("bk1", "broker", "zk1", 2181, 2182, 2183, Seq("node1")) -> bkExistContainers)
    }
  }

  override protected def resolveHostName(node: String): String = {
    "1.1.1.1"
  }

  override def addNode(clusterName: String, nodeName: String)(
    implicit executionContext: ExecutionContext): Future[BrokerApi.BrokerClusterInfo] =
    throw new UnsupportedOperationException("Not support addNode function")

  override def removeNode(clusterName: String, nodeName: String)(
    implicit executionContext: ExecutionContext): Future[Boolean] =
    throw new UnsupportedOperationException("Not support removeNode function")
}