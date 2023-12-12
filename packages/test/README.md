# `@ngx-playwright/test` [![Latest published version on NPM](https://img.shields.io/npm/v/@ngx-playwright/test)](https://npm.im/@ngx-playwright/test)

Builder for running e2e tests using `@playwright/test` in Angular's `ng` CLI or Narwhal's `nx` CLI.

For angular applications, this comes with built-in support for Angular CDK's component harnesses.

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
   /** @type {import('@playwright/test').PlaywrightTestConfig} */
   const config = {
   	use: {
   		channel: "chrome",
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

1. Write your playwright tests as documented on the playwright docs!

## Angular integrations

The setup for an angular application is identical to the setup above, except for two minor changes:

1. If you're not using `@angular-devkit/build-angular` or `@nx/angular` to build your angular application, you'll have to add `--angular` to the `ng add @ngx-playwright/test` or `ng generate @ngx-playwright/test:setup` command.
1. In your tests and `playwright.config.js` (or `.ts`), replace all usage of `@playwright/test` with `@ngx-playwright/test`.
   This will give you access to a bunch of extra fixtures, described below.

## Angular fixtures

On top of [the built-in fixtures](https://playwright.dev/docs/api/class-fixtures) provided by playwright itself, this package adds the following fixtures when you use the `test` function from `@ngx-playwright/test` instead of `@playwright/test`:

- `enableAutomaticStabilization`: Whether automatic waiting for the angular app to become stable is enabled by default.
  Setting this to true (which is the default) makes all elements created on the current page automatically wait upon interaction. Waiting is done before anything is read from the page, and after anything is done to the page.
  Setting this to false disables this behavior, requiring manual stabilization when needed.
  This only influences the main page. Manual stabilization is always required on secondary pages.
- `open`: Function that takes an openable screen (see below), navigates the main page to the screen and returns an instance of the screen's component harness
- `inScreen`: Function that takes an openable screen (see below), navigates to it and runs the given test function. This test function can destructure properties on the screen's component harness without having to `await`, making for more ergonomic tests.

An "openable screen" is a component harness class with one of the following properties:

- A static `path` property, a string that is resolved with the `baseURL` and then navigated towards.

  ```js
  class LoginScreen extends ComponentHarness {
  	static hostSelector = "body";
  	static path = "/login";

  	username = this.locatorFor("input#username");
  	password = this.locatorFor("input#password");
  	submit = this.locatorFor("button#submit");
  }
  ```

- A static `open` function that takes the `page` and the `baseURL` and navigates the page to the correct screen. This allows for more complex scenarios, by e.g. first passing a logon screen and then opening the screen itself.

  ```js
  class AuthenticatedHomepageScreen extends ComponentHarness {
  	static hostSelector = "body";
  	static async open(_, baseUrl, open) {
  		const loginScreen = await open(LoginScreen);

  		await (await loginScreen.username()).sendKeys("j.doe");
  		await (
  			await loginScreen.password()
  		).sendKeys("correct horse battery staple");
  		await (await loginScreen.submit()).click();
  	}
  }
  ```

There are two ways to gain access to these fixtures:

1. The easiest is to import `test` from `@ngx-playwright/test` instead of `@playwright/test`. In fact, this package re-exports everything from `@playwright/test` so you can import everything from `@ngx-playwright/test` instead.
2. Alternatively you can mix in the `@ngx-playwright/test` fixtures using the `mixinFixtures` function. This function allows combining multiple playwright fixture libraries into a single `test` function.  
   Here's an example:

```js
import {mixinFixtures as mixinCoverage} from "@bgotink/playwright-coverage";
import {mixinFixtures as mixinNgxPlaywright} from "@ngx-playwright/test";
import {test as base} from "@playwright/test";

const test = mixinCoverage(mixinNgxPlaywright(base));
```

The package also exposes a `createTest` function that generates a `test` function linked to a given screen:

```js
import {createTest} from "@ngx-playwright/test";

const test = createTest(LoginScreen);
```

There's also a `mixinScreenFixtures` function that can be used to combine multiple fixture libraries:

```js
import {mixinFixtures as mixinCoverage} from "@bgotink/playwright-coverage";
import {mixinScreenFixtures} from "@ngx-playwright/test";
import {test as base} from "@playwright/test";

const test = mixinCoverage(mixinScreenFixtures(LoginScreen, base));
```

The test function created by `mixinScreenFixtures` or `createTest` automatically opens the passed in screen in the tests it's used in.
It also exposes an extra special `$` fixture. This fixture can only be used via destructuring:

```js
test("submitting login form successfully should navigate away from login screen", async ({
	page,
	$: {username, password, submit},
}) => {
	await expect(page.title()).resolves.toBe("Login screen");

	await username.sendKeys("j.doe");
	await password.sendKeys("correct horse battery staple");
	await submit.click();

	await expect(page.title()).resolves.not.toBe("Login screen");
});
```

All properties on the screen class that was passed into `createTest` or `mixinScreenFixtures` and that are of type `() => Promise<T>` are available on the `$` fixture. All properties that are destructured are created by calling their respective functions and awaiting the promises. Only the properties that are destructured will be created this way, other functions will not be called.

## License

Licensed under the MIT license, see `LICENSE.md`.
