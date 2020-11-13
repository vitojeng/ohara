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

const fs = require('fs');
const execa = require('execa');
const package = require('../package.json');

const { logger } = require('../utils/commonUtils');
const srcBase = '../ohara-it/build/libs';
const distBase = './client/cypress/fixtures/jars';
const files = [
  'ohara-it-source.jar',
  'ohara-it-sink.jar',
  'ohara-it-stream.jar',
  `ohara-it-${package.version}.jar`,
];

const filesExist = files.every((file) => fs.existsSync(`${distBase}/${file}`));

if (!filesExist) {
  const args = process.argv.slice(2);
  // Only rebuild the jars if not in QA
  if (!args || args.shift() !== '--ci') {
    try {
      const value = execa.sync('./gradlew', ['ohara-it:jar'], {
        cwd: '..',
        stdio: 'inherit',
      });

      logger.log(`build jars output: ${value.stdout}`);
    } catch (err) {
      logger.error(err.message);
      /* eslint-disable no-process-exit */
      process.exit(1);
      /* eslint-enable no-process-exit */
    }
  }

  if (!fs.existsSync(`${distBase}`)) {
    fs.mkdirSync(`${distBase}`, { recursive: true });
  }

  files.forEach((file) => {
    fs.copyFileSync(`${srcBase}/${file}`, `${distBase}/${file}`);
  });
}
