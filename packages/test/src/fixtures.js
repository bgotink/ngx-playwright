import {
  createEnvironment,
  autoStabilize,
  manuallyStabilize,
} from '@ngx-playwright/harness';
import {test as base} from '@playwright/test';
import {createRequire} from 'module';

import {openScreen, createInScreenFn} from './screen.js';

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
    use(screen => openScreen(baseURL, page, harnessEnvironment, screen)),

  harnessEnvironment: ({page}, use) => use(createEnvironment(page)),

  context: async ({context}, use) => {
    await context.addInitScript({
      path: createRequire(import.meta.url).resolve(
        '@ngx-playwright/harness/zone-patch',
      ),
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
