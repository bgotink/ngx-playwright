import type {HarnessEnvironment, TestElement} from '@angular/cdk/testing';
import type {ElementHandle, Page} from 'playwright-core';

import {PlaywrightHarnessEnvironment} from './environment';

/**
 * Create a harness environment for the given page
 *
 * The returned environment will remain in action even after page navigation, though all elements created by the environment will be invalidated.
 *
 * @param page - The page to create an environment for
 * @returns The harness environment
 * @public
 */
export function createEnvironment(page: Page): HarnessEnvironment<unknown> {
  return new PlaywrightHarnessEnvironment(page);
}

/**
 * Get the playwright element handle backing the given test element
 *
 * This function allows for escaping the harness API provided by `@angular/cdk/testing` to use playwright APIs directly.
 *
 * This function should not be used from within a component harness, as that links the harness to the playwright environment.
 * It can safely be used inside tests that run playwright.
 *
 * @throws If the given test element wasn't created by the playwright harness environment
 * @param element - The test element to get the native element for
 * @returns The playwright element backing the given test element
 * @public
 */
export function getNativeElement(
  element: TestElement,
): ElementHandle<HTMLElement | SVGElement> {
  const handle = PlaywrightHarnessEnvironment.unwrap(element);
  if (handle == null) {
    throw new Error(
      'This TestElement was not created by PlaywrightHarnessEnvironment',
    );
  }

  return handle;
}
