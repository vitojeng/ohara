package com.island.ohara.configurator.store

import com.island.ohara.client.configurator.v0.ConnectorApi.ConnectorDescription
import com.island.ohara.client.configurator.v0.Data
import com.island.ohara.common.data.Serializer
import com.island.ohara.common.rule.MediumTest
import com.island.ohara.common.util.{CommonUtils, Releasable}
import com.island.ohara.configurator.Configurator
import org.junit.{After, Test}
import org.scalatest.Matchers

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.duration._
import scala.concurrent.{Await, Future}

private[store] final case class TestData(id: String,
                                          name: String,
                                          lastModified: Long,
                                          kind: String) extends Data

class TestDataStore extends MediumTest with Matchers {

  private[configurator] val DATA_SERIALIZER: Serializer[Data] = new Serializer[Data] {
    override def to(obj: Data): Array[Byte] = Serializer.OBJECT.to(obj)

    override def from(bytes: Array[Byte]): Data =
      Serializer.OBJECT.from(bytes).asInstanceOf[Data]
  }

  private[this] val timeout = 10 seconds
  private[this] val store = DataStore(Store.inMemory(Serializer.STRING, Configurator.DATA_SERIALIZER))


  private def newTestData(id: String) = TestData(
    id = id,
    name = "name1",
    lastModified = CommonUtils.current(),
    kind = "kind1"
  )

  @After
  def tearDown(): Unit = Releasable.close(store)

  @Test
  def testAdd(): Unit = {
    val data = newTestData("abcd")
    Await.result(store.add(data), timeout)

    Await.result(store.exist[TestData](data.id), timeout) shouldBe true
    Await.result(store.exist[TestData]("12345"), timeout) shouldBe false
    Await.result(store.nonExist[TestData](data.id), timeout) shouldBe false
    Await.result(store.nonExist[TestData]("12345"), timeout) shouldBe true
  }

  @Test
  def testUpdate(): Unit = {
    val data = newTestData("abcd")
    Await.result(store.add(data), timeout)

    val data2 = (data: TestData) => Future.successful(data.copy(name = "name2"))

    Await.result(store.update(data.id, data2), timeout) should equal(data.copy(name = "name2"))
    an[NoSuchElementException] should be thrownBy Await.result(store.update("123", data2), timeout)
  }

  @Test
  def testList(): Unit = {
    Await.result(store.add(newTestData("abcd")), timeout)
    Await.result(store.add(newTestData("xyz")), timeout)

    store.size shouldBe 2
  }

  @Test
  def testRemove(): Unit = {
    val data1 = newTestData("abcd")
    val data2 = newTestData("xyz")

    Await.result(store.add(data1), timeout)
    Await.result(store.add(data2), timeout)
    store.size shouldBe 2

    an[NoSuchElementException] should be thrownBy Await.result(store.remove("1234"), 50 seconds)
    an[NoSuchElementException] should be thrownBy Await.result(store.remove[TestData]("1234"), 50 seconds)
    an[NoSuchElementException] should be thrownBy Await.result(store.remove[ConnectorDescription]("abcd"), 50 seconds)

    Await.result(store.remove[TestData]("abcd"), 50 seconds) shouldBe data1
    store.size shouldBe 1
  }

  @Test
  def testRaw(): Unit = {
    val data1 = newTestData("abcd")

    Await.result(store.add(data1), timeout)
    store.size shouldBe 1

    an[NoSuchElementException] should be thrownBy Await.result(store.remove("1234"), 50 seconds)
    an[NoSuchElementException] should be thrownBy Await.result(store.remove[TestData]("1234"), 50 seconds)
    an[NoSuchElementException] should be thrownBy Await.result(store.remove[ConnectorDescription]("abcd"), 50 seconds)

    Await.result(store.raw(), timeout).head.asInstanceOf[TestData] shouldBe data1
    Await.result(store.raw("abcd"), timeout).asInstanceOf[TestData] shouldBe data1
  }

}


