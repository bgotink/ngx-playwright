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
 */
export function shouldStabilizeAutomatically() {
  return isRegistered && disabledCount === 0;
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
      page().evaluate(waitUntilAngularStable).then(status.onDetectChangesNow);
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
