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

module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: './',
    project: ['./tsconfig.json', './cypress/tsconfig.json'],
  },
  extends: [
    'react-app',
    'plugin:cypress/recommended',
    'plugin:prettier/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],
  plugins: ['prettier', '@typescript-eslint', 'jest'],
  rules: {
    'jest/no-focused-tests': 'warn',
    'jest/valid-describe': 'warn',
    'jest/no-identical-title': 'warn',
    'no-alert': 'warn',
    'no-debugger': 'warn',
    'no-console': 'warn',
    'no-unused-vars': [
      'warn',
      {
        args: 'after-used',
      },
    ],
    'no-template-curly-in-string': 'warn',
    'no-case-declarations': 'off',
    'array-callback-return': 'warn',
    'object-shorthand': 'warn',
    'react/prop-types': 'warn',
    'react/no-unused-prop-types': 'warn',
    'react/no-unknown-property': 'warn',
    'dot-notation': 'warn',
    camelcase: [
      'warn',
      {
        properties: 'never',
        ignoreDestructuring: true,
      },
    ],
    'react/jsx-sort-props': [
      'warn',
      {
        ignoreCase: false,
        callbacksLast: false,
      },
    ],
    eqeqeq: 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-use-before-define': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/camelcase': 'off',
    '@typescript-eslint/unbound-method': 'off',
    'cypress/no-unnecessary-waiting': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/ban-ts-ignore': 'off',
  },
  overrides: [
    {
      files: ['./**/*.ts?(x)'],
      rules: {
        '@typescript-eslint/no-use-before-define': 'warn',
      },
    },
  ],
};
