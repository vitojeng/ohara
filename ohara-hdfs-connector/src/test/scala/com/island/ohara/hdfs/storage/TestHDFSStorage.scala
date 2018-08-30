package com.island.ohara.hdfs.storage

import java.io.{InputStream, OutputStream}

import com.island.ohara.integration.OharaTestUtil
import com.island.ohara.rule.LargeTest
import org.apache.hadoop.fs.{FileSystem, Path}
import org.junit.{After, Test}
import org.scalatest.Matchers

class TestHDFSStorage extends LargeTest with Matchers {

  private[this] val testUtil = OharaTestUtil.localHDFS(1)
  @Test
  def testHdfsStorage(): Unit = {
    val fileSystem: FileSystem = testUtil.fileSystem
    val hdfsTempDir: String = testUtil.tmpDirectory
    val hdfsStorage: Storage = new HDFSStorage(fileSystem)
    hdfsStorage.list(hdfsTempDir).size shouldBe 0

    fileSystem.createNewFile(new Path(s"$hdfsTempDir/file.txt"))
    hdfsStorage.list(hdfsTempDir).size shouldBe 1

    fileSystem.mkdirs(new Path(s"$hdfsTempDir/1"))
    fileSystem.mkdirs(new Path(s"$hdfsTempDir/2"))
    hdfsStorage.list(hdfsTempDir).size shouldBe 3
  }

  @Test
  def testOpenFile(): Unit = {
    val fileSystem: FileSystem = testUtil.fileSystem
    val hdfsTempDir: String = testUtil.tmpDirectory
    val fileName: String = s"$hdfsTempDir/file.txt"
    val hdfsStorage: Storage = new HDFSStorage(fileSystem)
    val text: String = "helloworld"

    fileSystem.createNewFile(new Path(fileName))
    val outputStream: OutputStream = hdfsStorage.open(fileName, true)
    outputStream.write(text.getBytes)
    outputStream.close()

    val inputStream: InputStream = fileSystem.open(new Path(fileName))
    val result: StringBuilder = new StringBuilder()
    Stream
      .continually(inputStream.read())
      .takeWhile(_ != -1)
      .foreach(x => {
        result.append(x.toChar)
      })
    inputStream.close()
    result.toString() shouldBe text
  }

  @Test
  def testRename(): Unit = {
    val fileSystem: FileSystem = testUtil.fileSystem
    val hdfsTempDir: String = testUtil.tmpDirectory
    val folderName: String = s"$hdfsTempDir/folder1"
    val newFolderName: String = s"$hdfsTempDir/folder2"

    fileSystem.create(new Path(folderName))

    val hdfsStorage: Storage = new HDFSStorage(fileSystem)
    hdfsStorage.exists(folderName) shouldBe true
    hdfsStorage.renameFile(folderName, newFolderName) shouldBe true
    hdfsStorage.exists(folderName) shouldBe false
    hdfsStorage.exists(newFolderName) shouldBe true
  }

  @Test
  def testNewInstance(): Unit = {
    val hdfsStorage: Storage = Class
      .forName("com.island.ohara.hdfs.storage.HDFSStorage")
      .getConstructor(classOf[FileSystem])
      .newInstance(testUtil.fileSystem)
      .asInstanceOf[Storage]

    hdfsStorage.mkdirs("test")

  }

  @After
  def tearDown(): Unit = {
    testUtil.close()
  }
}
