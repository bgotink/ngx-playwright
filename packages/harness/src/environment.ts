import {HarnessEnvironment, TestElement} from '@angular/cdk/testing';
import type {ElementHandle} from 'playwright-core';

import {PlaywrightElement} from './element';

/**
 * @internal
 */
export class PlaywrightHarnessEnvironment extends HarnessEnvironment<
  ElementHandle<HTMLElement | SVGElement>
> {
  readonly #documentRoot: ElementHandle<HTMLBodyElement>;

  constructor(
    documentRoot: ElementHandle<HTMLBodyElement>,
    element: ElementHandle<HTMLElement | SVGElement> = documentRoot,
  ) {
    super(element);

    this.#documentRoot = documentRoot;
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
