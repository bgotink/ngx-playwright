module.exports = {
  testRunner: require.resolve('jest-circus/runner'),

  testEnvironment: require.resolve(
    '@ngx-playwright/jest/preset/environment.js',
  ),
  runner: require.resolve('@ngx-playwright/jest/preset/runner.js'),

  setupFilesAfterEnv: [
    require.resolve('@ngx-playwright/jest/preset/beforeAll.js'),
  ],
};
