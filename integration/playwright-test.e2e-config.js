// @ts-check

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
};

module.exports = config;
