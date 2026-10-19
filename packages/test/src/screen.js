import {parallel} from "@ngx-playwright/harness";

import {createEnvironment} from "./harness/index.js";
import {getDestructuredArguments} from "./parse-arguments.js";

/**
 * @param {import('./types.js').PlaywrightOpenableHarness<import("@ngx-playwright/harness").AnyComponentHarness>} harness
 * @returns {harness is import('./types.js').PlaywrightOpenableHarnessWithOpenFunction<import("@ngx-playwright/harness").AnyComponentHarness>}
 */
function hasOpenFunction(harness) {
	return (
		typeof (
			/** @type {import('./types.js').PlaywrightOpenableHarnessWithOpenFunction<import("@ngx-playwright/harness").AnyComponentHarness>} */ (
				harness
			).open
		) === "function"
	);
}

/**
 * @template {import('@ngx-playwright/harness').AnyComponentHarness} T
 * @param {string | undefined} baseURL
 * @param {import('@playwright/test').Page} page
 * @param {import('./harness/index.js').PlaywrightHarnessEnvironment} harnessEnvironment
 * @param {import('./types.js').PlaywrightOpenableHarness<T>} harness
 * @returns {Promise<T>}
 */
export async function openHarness(baseURL, page, harnessEnvironment, harness) {
	if (baseURL == null) {
		throw new Error(
			"Expected baseURL to be set, did you run via @ngx-playwright/test:run?",
		);
	}

	let isOpen;
	if (typeof harness.isOpen === "function") {
		isOpen = await harness.isOpen(page, baseURL);
	}

	if (isOpen == null && "path" in harness && typeof harness.path === "string") {
		const url = new URL(harness.path, baseURL);
		const currentUrl = new URL(page.url());

		// Should this be more intelligent? e.g. if the page to open is example.com/lorem
		// and the currently open page is example.com/lorem?ipsum, then the page is actually
		// already open
		// Then again, that sounds like it could be a problem if you want to use the open
		// function to clear the URL's search and hash?
		isOpen = url.href === currentUrl.href;
	}

	if (!isOpen) {
		if (hasOpenFunction(harness)) {
			await harness.open(page, baseURL, (harness) =>
				openHarness(baseURL, page, harnessEnvironment, harness),
			);
		} else if ("path" in harness && typeof harness.path === "string") {
			await page.goto(new URL(harness.path, baseURL).href);
		} else {
			throw new Error(
				`Expected harness ${JSON.stringify(harness.name)} to be open but it wasn't`,
			);
		}
	}

	// Give the page some time to load
	await page.waitForSelector(harness.hostSelector);

	return harnessEnvironment.getHarness(harness);
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {import('./harness/index.js').PlaywrightHarnessEnvironment} harnessEnvironment
 * @param {string | undefined} baseURL
 * @returns {import('./types.js').InHarnessFn}
 */
export function createInHarnessFn(page, harnessEnvironment, baseURL) {
	/**
	 * @template {import("@ngx-playwright/harness").AnyComponentHarness} T
	 * @param {import('@playwright/test').Page | import('./types.js').PlaywrightOpenableHarness<T>} pageOrHarness
	 * @param {import('./types.js').PlaywrightOpenableHarness<T> | ((props: import('./types.js').ExtractablePropertiesOfHarness<T>, harness: T) => void | Promise<void>)} harnessOrFn
	 * @param {((props: import('./types.js').ExtractablePropertiesOfHarness<T>, harness: T) => void | Promise<void>)=} fn
	 * @returns {Promise<void>}
	 */
	async function inHarness(pageOrHarness, harnessOrFn, fn) {
		/** @type {import('@playwright/test').Page} */
		let _page;
		/** @type {import('./types.js').PlaywrightOpenableHarness<T>} */
		let Harness;
		/** @type {(props: import('./types.js').ExtractablePropertiesOfHarness<T>, harness: T) => void | Promise<void>} */
		let testFunction;

		if (typeof pageOrHarness === "function") {
			_page = page;
			Harness = pageOrHarness;
			testFunction = /** @type {typeof testFunction} */ (harnessOrFn);
		} else {
			_page = pageOrHarness;
			Harness = /** @type {typeof Harness} */ (harnessOrFn);
			testFunction = /** @type {typeof testFunction} */ (fn);
		}

		const args =
			/** @type {(keyof import('./types.js').ExtractablePropertiesOfHarness<T>)[]} */ (
				getDestructuredArguments(testFunction)
			);

		const _harnessEnvironment =
			_page === page ? harnessEnvironment : createEnvironment(_page);
		const harnessInstance = await openHarness(
			baseURL,
			_page,
			_harnessEnvironment,
			Harness,
		);

		if (args == null) {
			await testFunction(
				/** @type {import('./types.js').ExtractablePropertiesOfHarness<T>} */ ({}),
				harnessInstance,
			);
		} else {
			const properties = await parallel(() =>
				args.map(async (name) => {
					// @ts-expect-error Typescript doesn't realize name indexes harnessInstance
					const value = await harnessInstance[name]?.();

					return [name, value];
				}),
			);

			await testFunction(Object.fromEntries(properties), harnessInstance);
		}
	}

	return inHarness;
}
