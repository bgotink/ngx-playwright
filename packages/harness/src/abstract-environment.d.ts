import {HarnessEnvironment, TestElement} from '@angular/cdk/testing';
import {ElementHandle, Locator} from '@playwright/test';

export interface PlaywrightHarnessEnvironmentOptions {
  /**
   * If true, all query selectors respect shadowroots
   *
   * By default, shadow boundaries are pierced by all queries.
   */
  respectShadowBoundaries?: boolean;

  /**
   * If true, back the `TestElement`s with `Locator`s instead of `ElementHandle`s.
   *
   * Uses `ElementHandle`s by default
   */
  useLocators?: boolean;
}

export abstract class PlaywrightHarnessEnvironment extends HarnessEnvironment<
  ElementHandle<HTMLElement | SVGElement> | Locator
> {
  /**
   * If true, all query selectors respect shadowroots
   *
   * By default, shadow boundaries are pierced by all queries.
   */
  abstract get respectShadowBoundaries(): boolean;

  /**
   * Wait until the angular app is bootstrapped and stable
   *
   * This does more than {@link #forceStabilize}, which only waits for stability.
   */
  abstract waitForAngularReady(): Promise<void>;

  /**
   * Returns the playwright handle for the given element
   *
   * @param element A TestElement created by this environment
   * @returns The playwright ElementHandle underpinning the given TestElement
   * @throws If the given element wasn't created by a playwright environment
   */
  abstract getPlaywrightHandle(
    element: TestElement,
  ): Promise<ElementHandle<HTMLElement | SVGElement>>;

  /**
   * Returns the playwright locator for the given element
   *
   * @param element A TestElement created by this environment
   * @returns The playwright ElementHandle underpinning the given TestElement
   * @throws If the given element wasn't created by a playwright environment,
   *         or if this playwright environment isn't configured to use locators
   */
  abstract getPlaywrightLocator(element: TestElement): Locator;

  /**
   * Create a copy of the current environment with the given options
   */
  abstract withOptions(
    options: PlaywrightHarnessEnvironmentOptions,
  ): PlaywrightHarnessEnvironment;
}
