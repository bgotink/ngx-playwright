import {parallel} from "@ngx-playwright/harness";

import {test} from "./fixtures.js";
import {getDestructured$Argument} from "./parse-arguments.js";

/**
 * @template {import('@ngx-playwright/harness').AnyComponentHarness} C
 * @param {import('./types.js').PlaywrightOpenableHarness<C>} Harness
 * @returns {import('./args.js').NgxPlaywrightHarnessFixtures<C>}
 */
function createHarnessFixtures(Harness) {
	return {
		harness: [
			async ({openHarness}, use) => use(await openHarness(Harness)),
			{auto: true},
		],

		$: async ({harness}, use, testInfo) => {
			const propertyNames =
				/** @type {import('./types.js').ExtractablePropertyNamesOfHarness<C>[] | null} */ (
					getDestructured$Argument(testInfo.fn)
				);

			if (propertyNames == null) {
				await use(
					/** @type {import('./types.js').ExtractablePropertiesOfHarness<C>} */ ({}),
				);
			} else {
				const entries = await parallel(() =>
					propertyNames.map(async (name) => {
						// @ts-expect-error Typescript doesn't know name indexes harness
						const value = await harness[name]?.();

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
 * @param {import('./types.js').PlaywrightOpenableHarness<C>} Harness
 * @param {import('@playwright/test').TestType<T, W>} test
 * @returns {import('@playwright/test').TestType<import('./args.js').NgxPlaywrightHarnessTestArgs<C> & T, W>}
 */
export function mixinHarnessFixtures(Harness, test) {
	return test.extend(createHarnessFixtures(Harness));
}

/**
 * Creates a `test` function
 *
 * Tests defined using the returned function have access to two extra fixtures:
 *
 * - `harness` is the instance of Harness
 * - `$` is a special fixture that has to be destructured in the parameter, which will make those
 *   destructured properties available. Accessing extra properties later on or using rest properties
 *   is not supported and will yield undefined values.
 *
 * @template {import("@ngx-playwright/harness").AnyComponentHarness} C
 * @param {import('./types.js').PlaywrightOpenableHarness<C>} Harness The harness class to run the test in
 * @returns A test function to use for tests in the given harness
 */
// The return type is very complex, typescript is more than capable of inferring it

export function createTest(Harness) {
	return mixinHarnessFixtures(Harness, test);
}
