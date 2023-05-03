// @ts-check
// cspell:ignore lcovonly lcov

import {join, dirname} from 'path';
import {fileURLToPath} from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * @type {import('@ngx-playwright/test').PlaywrightTestConfig}
 */
const config = {
  use: {
    channel: 'chrome',
    headless: true,
  },

  testDir: join(__dirname, 'e2e/test-specs'),
  testMatch: '**/*.e2e-spec.js',

  projects: [
    {
      name: 'using ElementHandle',
      use: {
        harnessEnvironmentOptions: {
          useLocators: false,
        },
      },
    },
    {
      name: 'using Locator',
      use: {
        harnessEnvironmentOptions: {
          useLocators: true,
        },
      },
    },
  ],

  reporter: [
    [process.env.CI ? 'github' : 'list'],
    ['junit', {outputFile: join(__dirname, 'results/junit.xml')}],
    [
      '@bgotink/playwright-coverage',
      {
        resultDir: join(__dirname, 'results/e2e-coverage'),
        sourceRoot: join(__dirname, '..'),
        exclude: ['**/$_lazy_route_resources*'],
        reports: [
          // Create an HTML view at <resultDir>/index.html
          ['html'],
          // Create <resultDir>/coverage.lcov for consumption by tooling
          [
            'lcovonly',
            {
              file: 'coverage.lcov',
            },
          ],
          // Log a coverage summary at the end of the test run
          [
            'text-summary',
            {
              file: null,
            },
          ],
        ],
      },
    ],
  ],
};

export default config;
