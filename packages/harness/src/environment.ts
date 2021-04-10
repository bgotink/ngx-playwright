import {HarnessEnvironment, TestElement} from '@angular/cdk/testing';
import type {ElementHandle, Page} from 'playwright-core';
import {isAngularBootstrapped, waitUntilAngularStable} from './browser';

import {PlaywrightElement} from './element';
import {LazyRootHandle} from './lazy-handle';

const elementHandles = new WeakMap<
  TestElement,
  ElementHandle<HTMLElement | SVGElement>
>();

/**
 * @internal
 */
export class PlaywrightHarnessEnvironment extends HarnessEnvironment<
  ElementHandle<HTMLElement | SVGElement>
> {
  static unwrap(
    element: TestElement,
  ): ElementHandle<HTMLElement | SVGElement> | undefined {
    return elementHandles.get(element);
  }

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

  async forceStabilize() {
    try {
      await this.#page.waitForFunction(isAngularBootstrapped);
    } catch {
      throw new Error(
        "Angular failed to bootstrap, check that\n- The app works in the browser (i.e. there are no errorrs in the console), and\n- Angular's debug tools are enabled using enableDebugTools",
      );
    }
    await this.#page.evaluate(waitUntilAngularStable);
  }

  async waitForTasksOutsideAngular() {
    // TODO: how?, see also: https://github.com/angular/components/issues/17412
  }

  getDocumentRoot(): ElementHandle<HTMLElement | SVGElement> {
    return this.#documentRoot;
  }

  createTestElement(
    handle: ElementHandle<HTMLElement | SVGElement>,
  ): TestElement {
    // This function is called in the HarnessEnvironment constructor, so we
    // can't directly use private properties here due to the polyfill in tslib
    const element = new PlaywrightElement(
      () => this.#page,
      handle,
      () => this.forceStabilize(),
    );

    elementHandles.set(element, handle);

    return element;
  }

  createEnvironment(
    element: ElementHandle<HTMLElement | SVGElement>,
  ): PlaywrightHarnessEnvironment {
    return new PlaywrightHarnessEnvironment(
      this.#page,
      this.#documentRoot,
      element,
    );
  }

  getAllRawElements(
    selector: string,
  ): Promise<ElementHandle<HTMLElement | SVGElement>[]> {
    return this.rawRootElement.$$(selector);
  }
}
