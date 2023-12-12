import {parallel} from "@angular/cdk/testing";
import {createEnvironment} from "@ngx-playwright/harness";

import {getDestructuredArguments} from "./parse-arguments.js";

/**
 * @param {import('./types').PlaywrightScreen<import('@angular/cdk/testing').ComponentHarness>} screen
 * @returns {screen is import('./types').PlaywrightScreenWithOpenFunction<import('@angular/cdk/testing').ComponentHarness>}
 */
function hasOpenFunction(screen) {
	return (
		typeof (
			/** @type {import('./types').PlaywrightScreenWithOpenFunction<import('@angular/cdk/testing').ComponentHarness>} */ (
				screen
			).open
		) === "function"
	);
}

/**
 * @template {import('@angular/cdk/testing').ComponentHarness} T
 * @param {string | undefined} baseURL
 * @param {import('@playwright/test').Page} page
 * @param {import('@ngx-playwright/harness').PlaywrightHarnessEnvironment} harnessEnvironment
 * @param {import('./types').PlaywrightScreen<T>} screen
 * @returns {Promise<T>}
 */
export async function openScreen(baseURL, page, harnessEnvironment, screen) {
	if (baseURL == null) {
		throw new Error(
			"Expected baseURL to be set, did you run via @ngx-playwright/test:run?",
		);
	}

	if (hasOpenFunction(screen)) {
		await screen.open(page, baseURL, (screen) =>
			openScreen(baseURL, page, harnessEnvironment, screen),
		);
	} else {
		await page.goto(new URL(screen.path, baseURL).href);
	}

	return harnessEnvironment.getHarness(screen);
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {import('@ngx-playwright/harness').PlaywrightHarnessEnvironment} harnessEnvironment
 * @param {string | undefined} baseURL
 * @returns {import('./types').InScreenFn}
 */
export function createInScreenFn(page, harnessEnvironment, baseURL) {
	/**
	 * @template {import('@angular/cdk/testing').ComponentHarness} T
	 * @param {import('@playwright/test').Page | import('./types').PlaywrightScreen<T>} pageOrScreen
	 * @param {import('./types').PlaywrightScreen<T> | ((props: import('./types').ExtractablePropertiesOfScreen<T>, screen: T) => void | Promise<void>)} screenOrFn
	 * @param {((props: import('./types').ExtractablePropertiesOfScreen<T>, screen: T) => void | Promise<void>)=} fn
	 * @returns {Promise<void>}
	 */
	async function inScreen(pageOrScreen, screenOrFn, fn) {
		/** @type {import('@playwright/test').Page} */
		let _page;
		/** @type {import('./types').PlaywrightScreen<T>} */
		let Screen;
		/** @type {(props: import('./types').ExtractablePropertiesOfScreen<T>, screen: T) => void | Promise<void>} */
		let testFunction;

		if (typeof pageOrScreen === "function") {
			_page = page;
			Screen = pageOrScreen;
			testFunction = /** @type {typeof testFunction} */ (screenOrFn);
		} else {
			_page = pageOrScreen;
			Screen = /** @type {typeof Screen} */ (screenOrFn);
			testFunction = /** @type {typeof testFunction} */ (fn);
		}

		const args =
			/** @type {(keyof import('./types').ExtractablePropertiesOfScreen<T>)[]} */ (
				getDestructuredArguments(testFunction)
			);

		const _harnessEnvironment =
			_page === page ? harnessEnvironment : createEnvironment(_page);
		const screen = await openScreen(
			baseURL,
			_page,
			_harnessEnvironment,
			Screen,
		);

		if (args == null) {
			await testFunction(
				/** @type {import('./types').ExtractablePropertiesOfScreen<T>} */ ({}),
				screen,
			);
		} else {
			const properties = await parallel(() =>
				args.map(async (name) => {
					// @ts-expect-error Typescript doesn't realise name indexes screen
					const value = await screen[name]?.();

					return [name, value];
				}),
			);

			await testFunction(Object.fromEntries(properties), screen);
		}
	}

	return inScreen;
}
