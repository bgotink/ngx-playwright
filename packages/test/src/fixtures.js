import {test as base} from "@playwright/test";
import {fileURLToPath} from "node:url";

import {
	createEnvironment,
	autoStabilize,
	manuallyStabilize,
} from "./harness/index.js";
import {openScreen, createInScreenFn} from "./screen.js";

/** @type {import('./args.js').NgxPlaywrightFixtures} */
const ngxPlaywrightFixtures = {
	enableAutomaticStabilization: [true, {option: true}],

	_setupAutomaticStabilization: [
		({enableAutomaticStabilization}, use) => {
			if (enableAutomaticStabilization) {
				autoStabilize();
			} else {
				manuallyStabilize();
			}

			return use();
		},
		{auto: true},
	],

	inScreen: ({page, baseURL, harnessEnvironment}, use) => {
		return use(createInScreenFn(page, harnessEnvironment, baseURL));
	},

	open: ({page, baseURL, harnessEnvironment}, use) =>
		use((screen) => openScreen(baseURL, page, harnessEnvironment, screen)),

	harnessEnvironmentOptions: [{}, {option: true}],

	harnessEnvironment: ({page, harnessEnvironmentOptions}, use) =>
		use(createEnvironment(page, harnessEnvironmentOptions)),

	context: async ({context}, use) => {
		await context.addInitScript({
			path: fileURLToPath(new URL("harness/zone/patch.js", import.meta.url)),
		});

		return use(context);
	},
};

/**
 *
 * @template {import('@playwright/test').PlaywrightTestArgs & import('@playwright/test').PlaywrightTestOptions} T
 * @template {import('@playwright/test').PlaywrightWorkerArgs & import('@playwright/test').PlaywrightWorkerOptions} W
 * @param {import('@playwright/test').TestType<T, W>} test
 * @returns {import('@playwright/test').TestType<import('./args.js').NgxPlaywrightTestArgs & import('./args.js').NgxPlaywrightTestOptions & T, W>}
 */
export function mixinFixtures(test) {
	return test.extend(ngxPlaywrightFixtures);
}

export const test = mixinFixtures(base);
