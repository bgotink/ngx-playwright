# `@ngx-playwright/jest` [![Latest published version on NPM](https://img.shields.io/npm/v/@ngx-playwright/jest)](https://npm.im/@ngx-playwright/jest)

Builder for running e2e tests in an angular application using jest and playwright with Angular CDK's component harnesses.

## Set up

1. Install this package and `ts-jest`
1. Depending on your usage, you may have to install `playwright`, `playwright-chromium`, `playwright-firefox` or `playwright-webkit`
1. Create an `application/jest.e2e-config.js` e.g.

   ```js
   module.exports = {
     ...require('ts-jest/presets').defaults,
     preset: '@ngx-playwright/jest',

     rootDir: '.',
     testMatch: ['<rootDir>/e2e/specs/*.spec.ts'],

     globals: {
       'ts-jest': {
         tsconfig: '<rootDir>/e2e/tsconfig.json',
       },
     },
   };
   ```

1. Configure your e2e tests in the `angular.json`:

   ```json
   "e2e": {
     "builder": "@ngx-playwright/jest:run",
     "options": {
       "devServerTarget": "application:serve",
       "config": "application/jest.e2e-config.js"
     }
   },
   ```

1. Configure typescript by creating a small file called `application/e2e/setup.d.ts` containing

   ```ts
   import '@ngx-playwright/jest/global';
   ```

   and configuring `application/e2e/tsconfig.json`:

   ```jsonc
   {
     "compilerOptions": {
       // include any compiler options you want
       "types": ["jest"]
     },
     "include": ["setup.d.ts", "specs/*.spec.ts"]
   }
   ```

   This will make extra global variables available in your test, such as `browser`, `browserContext`, `page`, and `harnessEnvironment`, as well as all regular jest globals.

## Configuration

TODO

## License

Licensed under the MIT license, see `LICENSE.md`.
