import {
  handleAutoChangeDetectionStatus,
  stopHandlingAutoChangeDetectionStatus,
} from '@angular/cdk/testing';

import {waitUntilAngularStable} from './browser.js';

let isRegistered = false;
let disabledCount = 0;

/**
 * Returns whether the stabilize function should be executed automatically
 *
 * This takes into account whether automatic stabilization is turned on (see
 * {@link isAutoStabilizing}) and whether batch-mode is currently enabled.
 *
 * @returns {boolean}
 */
export function shouldStabilizeAutomatically() {
  return isRegistered && disabledCount === 0;
}

/**
 * Returns whether automatic stabilization is turned on
 *
 * Note this function doesn't take into account whether batch mode is enabled,
 * use {@link shouldStabilizeAutomatically} for that.
 *
 * @returns {boolean}
 */
export function isAutoStabilizing() {
  return isRegistered;
}

/** @type {Set<import('@playwright/test').Page>} */
const pages = new Set();

/**
 * Register the given page for automatic stabilization
 *
 * Automatic stabilization will wait for all registered pages to become stable before continuing.
 *
 * @param {import('@playwright/test').Page} page The page to register
 * @returns {void}
 */
export function registerPage(page) {
  if (pages.has(page)) {
    // already registered
    return;
  }

  pages.add(page);
  page.on('close', () => pages.delete(page));
}

/**
 * Automatically wait for the angular application to be come stable
 *
 * Calling this function makes all elements created in all environments
 * automatically wait. Waiting is done before anything is read from the page,
 * and after anything is done to the page.
 *
 * The environment automatically waits for stabilization by default, unless
 * {@link #manuallyStabilize} is called.
 */
export function autoStabilize() {
  if (isRegistered) {
    return;
  }

  isRegistered = true;
  handleAutoChangeDetectionStatus(status => {
    if (status.isDisabled) {
      if (disabledCount++) {
        status.onDetectChangesNow?.();
        return;
      }
    } else {
      if ((disabledCount = Math.max(0, disabledCount - 1))) {
        status.onDetectChangesNow?.();
        return;
      }
    }

    if (status.onDetectChangesNow) {
      Promise.all(
        Array.from(pages, page => page.evaluate(waitUntilAngularStable)),
      ).then(
        () => status.onDetectChangesNow?.(),
        () => status.onDetectChangesNow?.(),
      );
    }
  });
}

/**
 * Stop automatically waiting for the angular application to become stable
 *
 * Call {@link #forceStabilize} to manually wait until the app stabilizes.
 */
export function manuallyStabilize() {
  if (!isRegistered) {
    return;
  }

  isRegistered = false;
  stopHandlingAutoChangeDetectionStatus();
}
