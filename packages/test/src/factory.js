import {parallel} from "@ngx-playwright/harness";

import {test} from "./fixtures.js";
import {getDestructured$Argument} from "./parse-arguments.js";

/**
 * @template {import('@ngx-playwright/harness').AnyComponentHarness} C
 * @param {import('./types.js').PlaywrightScreen<C>} Screen
 * @returns {import('./args.js').NgxPlaywrightScreenFixtures<C>}
 */
function createScreenFixtures(Screen) {
	return {
		screen: [async ({open}, use) => use(await open(Screen)), {auto: true}],

		$: async ({screen}, use, testInfo) => {
			const propertyNames =
				/** @type {import('./types.js').ExtractablePropertyNamesOfScreen<C>[] | null} */ (
					getDestructured$Argument(testInfo.fn)
				);

			if (propertyNames == null) {
				await use(
					/** @type {import('./types.js').ExtractablePropertiesOfScreen<C>} */ ({}),
				);
			} else {
				const entries = await parallel(() =>
					propertyNames.map(async (name) => {
						// @ts-expect-error Typescript doesn't know name indexes screen
						const value = await screen[name]?.();

						return [name, value];
					}),
				);

				await use(Object.fromEntries(entries));
			}
		},
	};
}

/**
 * @template {import('@ngx-playwright/harness').AnyComponentHarness} C
 * @template {import('./args.js').NgxPlaywrightTestArgs & import('./args.js').NgxPlaywrightTestOptions & import('@playwright/test').PlaywrightTestArgs & import('@playwright/test').PlaywrightTestOptions} T
 * @template {import('./args.js').NgxPlaywrightTestWorkerArgs & import('@playwright/test').PlaywrightWorkerArgs & import('@playwright/test').PlaywrightWorkerOptions} W
 * @param {import('./types.js').PlaywrightScreen<C>} Screen
 * @param {import('@playwright/test').TestType<T, W>} test
 * @returns {import('@playwright/test').TestType<import('./args.js').NgxPlaywrightScreenTestArgs<C> & T, W>}
 */
export function mixinScreenFixtures(Screen, test) {
	return test.extend(createScreenFixtures(Screen));
}

/**
 * Creates a `test` function
 *
 * Tests defined using the returned function have access to two extra fixtures:
 *
 * - `screen` is the instance of Screen
 * - `$` is a special fixture that has to be destructured in the parameter, which will make those
 *   destructured properties available. Accessing extra properties later on or using rest properties
 *   is not supported and will yield undefined values.
 *
 * @template {import("@ngx-playwright/harness").AnyComponentHarness} C
 * @param {import('./types.js').PlaywrightScreen<C>} Screen The screen class to run the test in
 * @returns A test function to use for tests in the given screen
 */
// The return type is very complex, typescript is more than capable of inferring it

export function createTest(Screen) {
	return mixinScreenFixtures(Screen, test);
}
