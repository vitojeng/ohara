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

package oharastream.ohara.it.connector.smb

import oharastream.ohara.it.category.ConnectorGroup
import org.junit.AssumptionViolatedException
import org.junit.experimental.categories.Category

@Category(Array(classOf[ConnectorGroup]))
private[smb] trait SmbEnv {
  private[this] val IT_SMB_HOSTNAME_KEY: String   = "ohara.it.smb.hostname"
  private[this] val IT_SMB_PORT_KEY: String       = "ohara.it.smb.port"
  private[this] val IT_SMB_USERNAME_KEY: String   = "ohara.it.smb.username"
  private[this] val IT_SMB_PASSWORD_KEY: String   = "ohara.it.smb.password"
  private[this] val IT_SMB_SHARE_NAME_KEY: String = "ohara.it.smb.shareName"

  def hostname: String  = env(IT_SMB_HOSTNAME_KEY)
  def port: Int         = env(IT_SMB_PORT_KEY).toInt
  def username: String  = env(IT_SMB_USERNAME_KEY)
  def password: String  = env(IT_SMB_PASSWORD_KEY)
  def shareName: String = env(IT_SMB_SHARE_NAME_KEY)

  private[this] def env(key: String): String =
    sys.env.getOrElse(key, throw new AssumptionViolatedException("skip test"))
}
