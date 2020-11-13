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
const chalk = require('chalk');
const waitOn = require('wait-on');

const { logger } = require('../utils/commonUtils');

exports.isBuildDirExist = (testMode) => {
  if (!fs.existsSync('./client/build')) {
    logger.error(
      `Couldn't find the build directory, please run ${chalk.blue(
        'yarn setup',
      )} to build the static files that are needed in the ${testMode.toUpperCase()} test`,
    );
    return false;
  }

  return true;
};

exports.waitOnService = (url) =>
  new Promise((resolve, reject) => {
    waitOn(
      {
        resources: Array.isArray(url) ? url : [url],
        interval: 2000, // 2 sec
        window: 1000,
        log: true,
      },
      (err) => {
        if (err) {
          logger.error('error waiting for url', url);
          logger.error(err.message);
          return reject(err);
        }
        resolve(); // success!
      },
    );
  });

exports.getDefaultEnv = () => {
  const filePath = './client/cypress.env.json';
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath));
  }

  return {};
};

exports.buildCypressEnv = (options) => {
  const { node, ci, clientPort, serverPort, prefix } = options;
  const { nodeHost, nodePort, nodeUser, nodePass } = node;

  const env = [];
  env.push(`port=${ci ? clientPort : serverPort}`);

  if (nodeHost) {
    env.push(`nodeHost=${nodeHost}`);
  }
  if (nodePort) {
    env.push(`nodePort=${nodePort}`);
  }
  if (nodeUser) {
    env.push(`nodeUser=${nodeUser}`);
  }
  if (nodePass) {
    env.push(`nodePass=${nodePass}`);
  }
  if (prefix) {
    env.push(`servicePrefix=${prefix}`);
  }
  return env.join(',');
};
