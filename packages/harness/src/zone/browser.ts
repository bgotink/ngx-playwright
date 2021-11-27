/**
 * @file
 * These functions run inside the browser via playwright's `evaluate` functions.
 *
 * Every function has to be pure. They cannot have any dependencies, not even to
 * other functions in this file.
 */

/// <reference types="zone.js" />

import type {PatchedRootZone} from './types';

export function waitUntilRootZoneStable(): Promise<void> {
  const rootZone = Zone.root as Zone & Partial<PatchedRootZone>;

  return (
    rootZone._ngxWaitUntilStable?.() ??
    Promise.reject(
      new Error(
        'waitForTasksOutsideAngular is only supported when using @ngx-playwright/test',
      ),
    )
  );
}
