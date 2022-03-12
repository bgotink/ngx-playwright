// @ts-check
// cspell:ignore lcovonly lcov

const {join} = require('path');

/**
 * @type {import('@ngx-playwright/test').PlaywrightTestConfig}
 */
const config = {
  use: {
    channel: 'chrome',
    headless: true,
  },

  testDir: join(__dirname, 'e2e/test-specs'),
  testMatch: '**/*.e2e-spec.ts',

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

module.exports = config;
