import {parallel} from "@ngx-playwright/harness";

import {createEnvironment} from "./harness/index.js";
import {getDestructuredArguments} from "./parse-arguments.js";

/**
 * @param {import('./types.js').PlaywrightScreen<import("@ngx-playwright/harness").AnyComponentHarness>} screen
 * @returns {screen is import('./types.js').PlaywrightScreenWithOpenFunction<import("@ngx-playwright/harness").AnyComponentHarness>}
 */
function hasOpenFunction(screen) {
	return (
		typeof (
			/** @type {import('./types.js').PlaywrightScreenWithOpenFunction<import("@ngx-playwright/harness").AnyComponentHarness>} */ (
				screen
			).open
		) === "function"
	);
}

/**
 * @template {import('@ngx-playwright/harness').AnyComponentHarness} T
 * @param {string | undefined} baseURL
 * @param {import('@playwright/test').Page} page
 * @param {import('./harness/index.js').PlaywrightHarnessEnvironment} harnessEnvironment
 * @param {import('./types.js').PlaywrightScreen<T>} screen
 * @returns {Promise<T>}
 */
export async function openScreen(baseURL, page, harnessEnvironment, screen) {
	if (baseURL == null) {
		throw new Error(
			"Expected baseURL to be set, did you run via @ngx-playwright/test:run?",
		);
	}

	if (
		typeof screen.isOpen !== "function" ||
		!(await screen.isOpen(page, baseURL))
	) {
		if (hasOpenFunction(screen)) {
			await screen.open(page, baseURL, (screen) =>
				openScreen(baseURL, page, harnessEnvironment, screen),
			);
		} else if ("path" in screen && typeof screen.path === "string") {
			await page.goto(new URL(screen.path, baseURL).href);
		} else {
			throw new Error("Expected screen to be open but it wasn't");
		}
	}

	return harnessEnvironment.getHarness(screen);
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {import('./harness/index.js').PlaywrightHarnessEnvironment} harnessEnvironment
 * @param {string | undefined} baseURL
 * @returns {import('./types.js').InScreenFn}
 */
export function createInScreenFn(page, harnessEnvironment, baseURL) {
	/**
	 * @template {import("@ngx-playwright/harness").AnyComponentHarness} T
	 * @param {import('@playwright/test').Page | import('./types.js').PlaywrightScreen<T>} pageOrScreen
	 * @param {import('./types.js').PlaywrightScreen<T> | ((props: import('./types.js').ExtractablePropertiesOfScreen<T>, screen: T) => void | Promise<void>)} screenOrFn
	 * @param {((props: import('./types.js').ExtractablePropertiesOfScreen<T>, screen: T) => void | Promise<void>)=} fn
	 * @returns {Promise<void>}
	 */
	async function inScreen(pageOrScreen, screenOrFn, fn) {
		/** @type {import('@playwright/test').Page} */
		let _page;
		/** @type {import('./types.js').PlaywrightScreen<T>} */
		let Screen;
		/** @type {(props: import('./types.js').ExtractablePropertiesOfScreen<T>, screen: T) => void | Promise<void>} */
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
			/** @type {(keyof import('./types.js').ExtractablePropertiesOfScreen<T>)[]} */ (
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
				/** @type {import('./types.js').ExtractablePropertiesOfScreen<T>} */ ({}),
				screen,
			);
		} else {
			const properties = await parallel(() =>
				args.map(async (name) => {
					// @ts-expect-error Typescript doesn't realize name indexes screen
					const value = await screen[name]?.();

					return [name, value];
				}),
			);

			await testFunction(Object.fromEntries(properties), screen);
		}
	}

	return inScreen;
}
