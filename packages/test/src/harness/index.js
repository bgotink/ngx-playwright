import {registerPage} from "./change-detection.js";
import {PlaywrightHarnessEnvironment} from "./environment.js";

export {PlaywrightHarnessEnvironment};

/** @typedef {import('./types.js').PlaywrightHarnessEnvironmentOptions} PlaywrightHarnessEnvironmentOptions */

/**
 * Create a harness environment for the given page
 *
 * The returned environment will remain in action even after page navigation, though all elements created by the environment will be invalidated.
 *
 * @param {import('@playwright/test').Page} page The page to create an environment for
 * @param {Readonly<PlaywrightHarnessEnvironmentOptions>} [options] Options for the environment
 * @returns {PlaywrightHarnessEnvironment} The harness environment
 * @public
 */
export function createEnvironment(page, options) {
	registerPage(page);
	return new PlaywrightHarnessEnvironment(page, options);
}

export {
	autoStabilize,
	manuallyStabilize,
	isAutoStabilizing,
} from "./change-detection.js";
