import {HarnessEnvironment, TestElement} from '@angular/cdk/testing';
import type {ElementHandle, Page} from 'playwright-core';
import {isAngularBootstrapped, waitUntilAngularStable} from './browser';
import {shouldStabilizeAutomatically} from './change-detection';

import {PlaywrightElement} from './element';
import {LazyRootHandle} from './lazy-handle';

const elementHandles = new WeakMap<
  TestElement,
  ElementHandle<HTMLElement | SVGElement>
>();

export abstract class PlaywrightHarnessEnvironment extends HarnessEnvironment<
  ElementHandle<HTMLElement | SVGElement>
> {
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
  ): ElementHandle<HTMLElement | SVGElement>;
}

/**
 * @internal
 */
export class PlaywrightHarnessEnvironmentImplementation extends PlaywrightHarnessEnvironment {
  readonly #page: Page;
  readonly #documentRoot: ElementHandle<HTMLElement | SVGElement>;

  constructor(
    page: Page,
    documentRoot: ElementHandle<HTMLElement | SVGElement> = new LazyRootHandle(
      page,
    ),
    element: ElementHandle<HTMLElement | SVGElement> = documentRoot,
  ) {
    super(element);

    this.#page = page;
    this.#documentRoot = documentRoot;
  }

  async waitForAngularReady() {
    try {
      await this.#page.waitForFunction(isAngularBootstrapped);
    } catch {
      throw new Error(
        'Angular failed to bootstrap the application, check whether there are any errors in the console when you open the application',
      );
    }

    await this.forceStabilize();
  }

  async forceStabilize() {
    await this.#page.evaluate(waitUntilAngularStable);
  }

  async waitForTasksOutsideAngular() {
    // TODO: how?, see also: https://github.com/angular/components/issues/17412
  }

  getPlaywrightHandle(element: TestElement) {
    const handle = elementHandles.get(element);

    if (handle == null) {
      throw new Error(
        'The given TestElement was not created by PlaywrightHarnessEnvironment',
      );
    }

    return handle;
  }

  protected getDocumentRoot(): ElementHandle<HTMLElement | SVGElement> {
    return this.#documentRoot;
  }

  protected createTestElement(
    handle: ElementHandle<HTMLElement | SVGElement>,
  ): TestElement {
    // This function is called in the HarnessEnvironment constructor, so we
    // can't directly use private properties here due to the polyfill in tslib
    const element = new PlaywrightElement(
      () => this.#page,
      handle,
      async () => {
        if (shouldStabilizeAutomatically()) {
          await this.forceStabilize();
        }
      },
    );

    elementHandles.set(element, handle);

    return element;
  }

  protected createEnvironment(
    element: ElementHandle<HTMLElement | SVGElement>,
  ): PlaywrightHarnessEnvironment {
    return new PlaywrightHarnessEnvironmentImplementation(
      this.#page,
      this.#documentRoot,
      element,
    );
  }

  protected getAllRawElements(
    selector: string,
  ): Promise<ElementHandle<HTMLElement | SVGElement>[]> {
    return this.rawRootElement.$$(selector);
  }
}
