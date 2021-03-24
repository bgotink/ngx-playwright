import {HarnessEnvironment, TestElement} from '@angular/cdk/testing';
import type {ElementHandle, Page} from 'playwright';

import {PlaywrightElement} from './element';
import {LazyBodyHandle} from './lazy-handle';

/**
 * @internal
 */
export class PlaywrightHarnessEnvironment extends HarnessEnvironment<
  ElementHandle<HTMLElement | SVGElement>
> {
  readonly #documentRoot: LazyBodyHandle;

  constructor(
    documentRoot: LazyBodyHandle,
    element: ElementHandle<HTMLElement | SVGElement> = documentRoot,
  ) {
    super(element);

    this.#documentRoot = documentRoot;
  }

  /**
   * Create a HarnessEnvironment for
   *
   * @param page The page to create an environment for
   * @returns The created environment
   */
  static load(page: Page): PlaywrightHarnessEnvironment {
    return new PlaywrightHarnessEnvironment(new LazyBodyHandle(page));
  }

  async forceStabilize() {
    // no-op
  }

  async waitForTasksOutsideAngular() {
    // TODO: how?, see also: https://github.com/angular/components/issues/17412
  }

  getDocumentRoot(): ElementHandle<HTMLBodyElement> {
    return this.#documentRoot;
  }

  createTestElement(
    element: ElementHandle<HTMLElement | SVGElement>,
  ): TestElement {
    return new PlaywrightElement(element);
  }

  createEnvironment(
    element: ElementHandle<HTMLElement | SVGElement>,
  ): PlaywrightHarnessEnvironment {
    return new PlaywrightHarnessEnvironment(this.#documentRoot, element);
  }

  getAllRawElements(
    selector: string,
  ): Promise<ElementHandle<HTMLElement | SVGElement>[]> {
    return this.rawRootElement.$$(selector);
  }
}
