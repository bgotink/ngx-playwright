import {
  handleAutoChangeDetectionStatus,
  stopHandlingAutoChangeDetectionStatus,
} from '@angular/cdk/testing';
import type {Page} from 'playwright-core';
import {waitUntilAngularStable} from './browser';

let isRegistered = false;
let disabledCount = 0;

/**
 * Returns whether the stabilize function should be executed automatically
 *
 * This takes into account whether automatic stabilization is turned on (see
 * {@link isAutoStabilizing}) and whether batch-mode is currently enabled.
 */
export function shouldStabilizeAutomatically() {
  return isRegistered && disabledCount === 0;
}

/**
 * Returns whether automatic stabilization is turned on
 *
 * Note this function doesn't take into account whether batch mode is enabled,
 * use {@link shouldStabilizeAutomatically} for that.
 */
export function isAutoStabilizing(): boolean {
  return isRegistered;
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
export function autoStabilize(page: () => Page): void {
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
      page()
        .evaluate(waitUntilAngularStable)
        .then(
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
export function manuallyStabilize(): void {
  if (!isRegistered) {
    return;
  }

  isRegistered = false;
  stopHandlingAutoChangeDetectionStatus();
}
