# `@ngx-playwright/test` [![Latest published version on NPM](https://img.shields.io/npm/v/@ngx-playwright/test)](https://npm.im/@ngx-playwright/test)

Builder for running e2e tests in an angular application using `@playwright/test` with Angular CDK's component harnesses.

## Set up

```bash
ng add @ngx-playwright/test
```

Or use the `setup` schematic:

```bash
yarn add @ngx-playwright/test
ng generate @ngx-playwright/test:setup --project my-application
```

Or install and configure it manually:

1. Install this package
1. Create a [test configuration](https://playwright.dev/docs/test-configuration), e.g.

   ```js
   /** @type {import('@ngx-playwright/test').PlaywrightTestConfig} */
   const config = {
     use: {
       channel: 'chrome',
       headless: true,
     },
   };

   module.exports = config;
   ```

1. Configure your e2e tests in the `angular.json`:

   ```json
   "e2e": {
     "builder": "@ngx-playwright/test:run",
     "options": {
       "config": "application/e2e/playwright.config.js",
       "devServerTarget": "serve"
     }
   },
   ```

1. Write your playwright tests as documented on the playwright docs, but replace all imports from `@playwright/test` with `@ngx-playwright/test`.

## Fixtures

On top of [the built-in fixtures](https://playwright.dev/docs/api/class-fixtures) provided by playwright itself, this package adds the following fixtures:

- `enableAutomaticStabilization`: Whether automatic waiting for the angular app to become stable is enabled by default.
  Setting this to true (which is the default) makes all elements created on the current page to automatically wait. Waiting is done before anything is read from the page, and after anything is done to the page.
  Setting this to false disables this behavior, requiring manual stabilization when needed.
  This only influences the main page. Manual stabilization is always required on secondary pages.
- `open`: Function that takes an openable screen (see below), navigates the main page to the screen and returns an instance of the screen's component harness
- `inScreen`: Function that takes an openable screen (see below), navigates to it and runs the given test function. This test function can destructure properties on the screen's component harness without having to `await`, making for more ergonomic tests.

An "openable screen" is a component harness class with one of the following properties:

- A static `path` property, a string that is resolved with the `baseURL` and then navigated towards.
- A static `open` function that takes the `page` and the `baseURL` and navigates the page to the correct screen. This allows for more complex scenarios, by e.g. first passing a logon screen and then opening the screen itself.

## License

Licensed under the MIT license, see `LICENSE.md`.
