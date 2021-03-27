# `@ngx-playwright/harness` ![Latest published version on NPM](https://img.shields.io/npm/v/@ngx-playwright/harness)

Angular CDK test harness environment for using component harnesses in playwright tests

## Usage

This package exposes two functions:

**`createEnvironment`** takes a playwright [`Page`][page] instance and turns it into a [`HarnessEnvironment`][harness-environment]. You can use this [`HarnessEnvironment`][harness-environment] to load [`TestElement`][test-element]s and [`ComponentHarness`][component-harness]es.

**`getNativeElement`** extracts the playwright [`ElementHandle`][element-handle] from a [`TestElement`][test-element]. It is an escape hatch from the CDK test harnesses, useful if you want to perform actions that require lower level access, e.g. to run screenshot tests.

## License

Licensed under the MIT license, see `LICENSE.md`.

[component-harness]: https://material.angular.io/cdk/test-harnesses/api#ComponentHarness
[element-handle]: https://playwright.dev/docs/api/class-elementhandle
[harness-environment]: https://material.angular.io/cdk/test-harnesses/api#HarnessEnvironment
[page]: https://playwright.dev/docs/api/class-page/
[test-element]: https://material.angular.io/cdk/test-harnesses/api#TestElement
