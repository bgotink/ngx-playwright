import {_setParallelImplementation} from "@ngx-playwright/harness";
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
	enableAutomaticStabilization: [
		// eslint-disable-next-line no-empty-pattern
		async ({}, use) => {
			let value;
			try {
				await import("@angular/cdk/testing");
				value = true;
			} catch {
				value = false;
			}

			await use(value);
		},
		{option: true},
	],

	_setupAutomaticStabilization: [
		async ({enableAutomaticStabilization}, use) => {
			let parallel,
				handleAutoChangeDetectionStatus,
				stopHandlingAutoChangeDetectionStatus;
			try {
				({
					parallel,
					handleAutoChangeDetectionStatus,
					stopHandlingAutoChangeDetectionStatus,
				} = await import("@angular/cdk/testing"));
			} catch {
				// ignore
			}

			if (enableAutomaticStabilization) {
				if (handleAutoChangeDetectionStatus == null) {
					throw new Error(
						"enableAutomaticStabilization requires @angular/cdk, but it could not be imported",
					);
				}

				autoStabilize(handleAutoChangeDetectionStatus);
			} else {
				manuallyStabilize(stopHandlingAutoChangeDetectionStatus);
			}

			if (parallel) {
				_setParallelImplementation(parallel);
			}

			await use();

			if (parallel) {
				_setParallelImplementation(undefined);
			}
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
