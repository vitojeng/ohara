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

package oharastream.ohara.it.client

import oharastream.ohara.client.configurator.NodeApi
import oharastream.ohara.it.{ContainerPlatform, IntegrationTest}
import org.junit.jupiter.api.Tag
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.{Arguments, MethodSource}
import org.scalatest.matchers.should.Matchers._

import scala.concurrent.ExecutionContext.Implicits.global
import scala.jdk.CollectionConverters._

@Tag("integration-test-client")
@EnabledIfEnvironmentVariable(named = "ohara.it.docker", matches = ".*")
class TestNode extends IntegrationTest {
  @ParameterizedTest(name = "{displayName} with {argumentsWithNames}")
  @MethodSource(value = Array("parameters"))
  def testListNodes(platform: ContainerPlatform): Unit =
    close(platform.setup()) { resourceRef =>
      val services =
        result(resourceRef.nodeApi.list()).flatMap(_.services)
      services should not be Seq.empty
      services.find(_.name == NodeApi.CONFIGURATOR_SERVICE_NAME) should not be None
    }(_ => ())

  @ParameterizedTest(name = "{displayName} with {argumentsWithNames}")
  @MethodSource(value = Array("parameters"))
  def testResources(platform: ContainerPlatform): Unit =
    close(platform.setup()) { resourceRef =>
      val nodes = result(resourceRef.nodeApi.list())
      nodes should not be Seq.empty
      nodes.foreach { node =>
        nodes.exists(_.hostname == node.hostname) shouldBe true
        node.resources should not be Seq.empty
        node.resources.size should be >= 1
        node.resources.foreach { resource =>
          resource.value.toInt should be >= 1
          resource.name.isEmpty shouldBe false
          resource.unit.isEmpty shouldBe false
        }
      }
    }(_ => ())

  @ParameterizedTest(name = "{displayName} with {argumentsWithNames}")
  @MethodSource(value = Array("parameters"))
  def testStatus(platform: ContainerPlatform): Unit =
    close(platform.setup()) { resourceRef =>
      val nodes = result(resourceRef.nodeApi.list())
      nodes should not be Seq.empty
      nodes.foreach { node =>
        nodes.exists(_.hostname == node.hostname) shouldBe true
        node.state shouldBe NodeApi.State.AVAILABLE
        node.error shouldBe None
      }
    }(_ => ())
}

object TestNode {
  def parameters: java.util.stream.Stream[Arguments] = ContainerPlatform.all.map(o => Arguments.of(o)).asJava.stream()
}
