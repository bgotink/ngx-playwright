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

  testDir: join(__dirname, 'specs'),
  testMatch: '**/*.e2e-spec.js',

  reporter: [
    [process.env.GITHUB_ACTION ? 'github' : 'list'],
    ['junit', {outputFile: join(__dirname, 'results/junit.xml')}],
  ],
};

export default config;
