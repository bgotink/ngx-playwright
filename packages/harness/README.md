# `@ngx-playwright/harness` [![Latest published version on NPM](https://img.shields.io/npm/v/@ngx-playwright/harness)](https://npm.im/@ngx-playwright/harness)

Angular CDK test harness environment for using component harnesses in playwright tests

## Usage

This package exposes four functions:

**`createEnvironment`** takes a playwright [`Page`][page] instance and turns it into a [`HarnessEnvironment`][harness-environment]. You can use this [`HarnessEnvironment`][harness-environment] to load [`TestElement`][test-element]s and [`ComponentHarness`][component-harness]es.

**`autoStabilize`** takes a `Page` and tells all environments to automatically wait until the page is stable before measuring any value and after performing any action. You can use `parallel`, exposed by `@angular/cdk/testing`, to trigger multiple actions without waiting between them.

**`manuallyStabilize`** disables the automatic waiting for stabilization.

**`isAutoStabilizing`** returns whether automatic stabilization is currently turned on.

The environment returned by `createEnvironment` is actually a **`PlaywrightHarnessEnvironment`**, which adds extra playwright-specific functionality on top of the general [`HarnessEnvironment`][harness-environment]`:

**`respectShadowBoundaries`** is a readonly property that tells you whether this environment respects shadow DOM boundaries. By default this is turned off. In other words, by default any CSS selector used to query elements can pierce through shadow boundaries.

**`withOptions`** creates a new `PlaywrightHarnessEnvironment` with the given options. Currently only one option is supported: `respectShadowBoundaries`.

**`getPlaywrightHandle`** takes a [`TestElement`][test-element] created by the environment and returns the playwright [`ElementHandle`][element-handle] powering the [`TestElement`][test-element]. Using this handle you can trigger APIs that the CDK doesn't support, such as uploading files or taking a screenshot.

**`waitForAngularReady`** waits for angular to finish bootstrapping. You can use this after navigation on the playwright [`Page`][page] to ensure your test gives the angular app the necessary time to set up.

## License

Licensed under the MIT license, see `LICENSE.md`.

[component-harness]: https://material.angular.io/cdk/test-harnesses/api#ComponentHarness
[element-handle]: https://playwright.dev/docs/api/class-elementhandle
[harness-environment]: https://material.angular.io/cdk/test-harnesses/api#HarnessEnvironment
[page]: https://playwright.dev/docs/api/class-page/
[test-element]: https://material.angular.io/cdk/test-harnesses/api#TestElement
