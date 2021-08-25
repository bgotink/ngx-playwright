module.exports = {
  ...require('ts-jest/presets').defaults,
  preset: '@ngx-playwright/jest',

  rootDir: __dirname,
  testMatch: ['<rootDir>/e2e/jest-specs/**/*.e2e-spec.ts'],

  testEnvironmentOptions: {
    launchOptions: {
      channel: 'chrome',
    },
  },

  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/e2e/tsconfig.jest.json',
    },
  },
};
