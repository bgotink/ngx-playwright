/**
 * @file
 * These functions run inside the browser via playwright's `evaluate` functions.
 *
 * Every function has to be pure. They cannot have any dependencies, not even to
 * other functions in this file.
 */

/// <reference types="zone.js" />
/* global Zone */

/**
 *
 * @returns {Promise<void>}
 */
export function waitUntilRootZoneStable() {
  const rootZone =
    /** @type {Zone & Partial<import('./types.js').PatchedRootZone>} */ (
      Zone.root
    );

  return (
    rootZone._ngxWaitUntilStable?.() ??
    Promise.reject(
      new Error(
        'waitForTasksOutsideAngular is only supported when using @ngx-playwright/test',
      ),
    )
  );
}
