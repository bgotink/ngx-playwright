import type {Page} from 'playwright-core';

import {
  PlaywrightHarnessEnvironment,
  PlaywrightHarnessEnvironmentImplementation,
} from './environment';

export {PlaywrightHarnessEnvironment};

/**
 * Create a harness environment for the given page
 *
 * The returned environment will remain in action even after page navigation, though all elements created by the environment will be invalidated.
 *
 * @param page - The page to create an environment for
 * @returns The harness environment
 * @public
 */
export function createEnvironment(page: Page): PlaywrightHarnessEnvironment {
  return new PlaywrightHarnessEnvironmentImplementation(page);
}

export {autoStabilize, manuallyStabilize} from './change-detection';
