import {_setParallelImplementation} from "@ngx-playwright/harness";
import {test as base} from "@playwright/test";
import {createRequire} from "node:module";
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

	harnessEnvironmentOptions: [{}, {option: true}],

	respectShadowBoundaries: [undefined, {option: true}],
	innerTextWithShadows: [undefined, {option: true}],
	useLocators: [undefined, {option: true}],
	selectorEngine: [undefined, {option: true}],

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

	_harnessEnvironmentOptions: (
		{
			harnessEnvironmentOptions,
			respectShadowBoundaries,
			innerTextWithShadows,
			useLocators,
			selectorEngine,
		},
		use,
	) => {
		return use({
			innerTextWithShadows:
				innerTextWithShadows ??
				harnessEnvironmentOptions.innerTextWithShadows ??
				false,
			respectShadowBoundaries:
				respectShadowBoundaries ??
				harnessEnvironmentOptions.respectShadowBoundaries ??
				false,
			useLocators:
				useLocators ?? harnessEnvironmentOptions.useLocators ?? false,
			selectorEngine:
				selectorEngine ?? harnessEnvironmentOptions.selectorEngine ?? null,
		});
	},

	inScreen: ({page, baseURL, harnessEnvironment}, use) => {
		return use(createInScreenFn(page, harnessEnvironment, baseURL));
	},

	open: ({page, baseURL, harnessEnvironment}, use) =>
		use((screen) => openScreen(baseURL, page, harnessEnvironment, screen)),

	harnessEnvironment: ({page, _harnessEnvironmentOptions}, use) =>
		use(createEnvironment(page, _harnessEnvironmentOptions)),

	context: async ({context}, use) => {
		await context.addInitScript({
			path: fileURLToPath(new URL("harness/zone/patch.js", import.meta.url)),
		});

		return use(context);
	},

	// Register composed CSS selector once per worker.
	_setupComposedCssSelector: [
		async ({playwright}, use) => {
			await playwright.selectors.register(
				"composed-css",
				{
					// Replace with import.meta.resolve() once targeting only Node ≥20.6.0
					path: createRequire(import.meta.url).resolve(
						"@ngx-playwright/composed-css/selector-engine",
					),
				},
				{contentScript: true},
			);
			await use();
		},
		{scope: "worker", auto: true},
	],
};

/**
 *
 * @template {import('@playwright/test').PlaywrightTestArgs & import('@playwright/test').PlaywrightTestOptions} T
 * @template {import('@playwright/test').PlaywrightWorkerArgs & import('@playwright/test').PlaywrightWorkerOptions} W
 * @param {import('@playwright/test').TestType<T, W>} test
 * @returns {import('@playwright/test').TestType<import('./args.js').NgxPlaywrightTestArgs & import('./args.js').NgxPlaywrightTestOptions & T, import('./args.js').NgxPlaywrightTestWorkerArgs & W>}
 */
export function mixinFixtures(test) {
	// @ts-expect-error Not sure what goes wrong, but...
	return test.extend(ngxPlaywrightFixtures);
}

export const test = mixinFixtures(base);
