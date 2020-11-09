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

export {};

const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const browserify = require('@cypress/browserify-preprocessor');

module.exports = (
  on: Cypress.PluginEvents,
  config: Cypress.PluginConfigOptions,
) => {
  require('@cypress/code-coverage/task')(on, config);
  on(
    'file:preprocessor',
    browserify({
      // @ts-ignore
      onBundle(bundle) {
        bundle.transform(require('browserify-istanbul'));
      },
      typescript: require.resolve('typescript'),
    }),
  );

  const testMode = process.env.CYPRESS_TEST_MODE;

  // using default configuration if no testMode supplied
  if (!testMode) return config;

  const currentConfig = getConfigByTestMode(testMode);

  // we overwrite default config by cypress.{api|it|e2e}.json file
  const newConfig = _.merge({}, config, currentConfig, {
    env: { testMode }, // Adding this so our tests are able to access the current test mode
  });

  // Default base URL
  if (!newConfig.baseUrl) newConfig.baseUrl = 'http://localhost:3000';

  return newConfig;
};

function getConfigByTestMode(testMode: string) {
  const pathToConfigFile = path.resolve(
    './cypress',
    'configs',
    `cypress.${testMode}.json`,
  );
  return JSON.parse(fs.readFileSync(pathToConfigFile, 'utf-8'));
}
