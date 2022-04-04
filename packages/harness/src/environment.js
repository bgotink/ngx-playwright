import {PlaywrightHarnessEnvironment} from './abstract-environment.js';
import {isAngularBootstrapped, waitUntilAngularStable} from './browser.js';
import {shouldStabilizeAutomatically} from './change-detection.js';
import {isLocator, PlaywrightElement} from './element.js';
import {waitUntilRootZoneStable} from './zone/browser.js';

/**
 * @type {WeakMap<import('@angular/cdk/testing').TestElement, import('playwright-core').ElementHandle<HTMLElement | SVGElement> | import('playwright-core').Locator>}
 */
const elementHandles = new WeakMap();

/**
 * @internal
 */
export class PlaywrightHarnessEnvironmentImplementation extends PlaywrightHarnessEnvironment {
  /**
   * @readonly
   * @type {import('playwright-core').Page}
   */
  #page;
  /**
   * @readonly
   * @type {import('playwright-core').Locator}
   */
  #documentRoot;

  /**
   * @readonly
   * @type {Required<import('./abstract-environment.js').PlaywrightHarnessEnvironmentOptions>}
   */
  #opts;

  /**
   *
   * @param {import('playwright-core').Page} page
   * @param {import('playwright-core').Locator=} documentRoot
   * @param {import('playwright-core').ElementHandle<HTMLElement | SVGElement> | import('playwright-core').Locator=} element
   * @param {import('./abstract-environment.js').PlaywrightHarnessEnvironmentOptions=} options
   */
  constructor(
    page,
    documentRoot = page.locator(':root'),
    element = documentRoot,
    options = {},
  ) {
    super(element);

    this.#page = page;
    this.#documentRoot = documentRoot;
    this.#opts = {
      respectShadowBoundaries: false,
      ...options,
    };
  }

  /**
   * @type {boolean}
   * @override
   */
  get respectShadowBoundaries() {
    return this.#opts.respectShadowBoundaries;
  }

  /**
   * @returns {Promise<void>}
   * @override
   */
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

  /**
   * @returns {Promise<void>}
   * @override
   */
  async forceStabilize() {
    await this.#page.evaluate(waitUntilAngularStable);
  }

  /**
   * @returns {Promise<void>}
   * @override
   */
  async waitForTasksOutsideAngular() {
    await this.#page.evaluate(waitUntilRootZoneStable);
  }

  /**
   * @param {import('@angular/cdk/testing').TestElement} element
   * @returns {Promise<import('playwright-core').ElementHandle<HTMLElement | SVGElement>>}
   * @override
   */
  async getPlaywrightHandle(element) {
    const handleOrLocator = elementHandles.get(element);

    if (handleOrLocator == null) {
      throw new Error(
        'The given TestElement was not created by PlaywrightHarnessEnvironment',
      );
    }

    if (isLocator(handleOrLocator)) {
      // Only one case where we are passed a Locator: the root element of the page, which is always
      // present -> we can safely ignore the null return type
      return /** @type {import('playwright-core').ElementHandle<HTMLElement | SVGElement>} */ (
        await handleOrLocator.elementHandle()
      );
    } else {
      return handleOrLocator;
    }
  }

  /**
   * @param {import('./abstract-environment.js').PlaywrightHarnessEnvironmentOptions} options
   * @returns {PlaywrightHarnessEnvironment}
   * @override
   */
  withOptions(options) {
    return new PlaywrightHarnessEnvironmentImplementation(
      this.#page,
      this.#documentRoot,
      this.rawRootElement,
      {
        ...this.#opts,
        ...options,
      },
    );
  }

  /**
   *
   * @returns {import('playwright-core').Locator}
   * @override
   * @protected
   */
  getDocumentRoot() {
    return this.#documentRoot;
  }

  /**
   * @param {import('playwright-core').ElementHandle<HTMLElement | SVGElement> | import('playwright-core').Locator} handle
   * @returns {import('@angular/cdk/testing').TestElement}
   * @override
   * @protected
   */
  createTestElement(handle) {
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

  /**
   * @param {import('playwright-core').ElementHandle<HTMLElement | SVGElement> | import('playwright-core').Locator} element
   * @returns {PlaywrightHarnessEnvironment}
   * @override
   * @protected
   */
  createEnvironment(element) {
    return new PlaywrightHarnessEnvironmentImplementation(
      this.#page,
      this.#documentRoot,
      element,
      this.#opts,
    );
  }

  /**
   * @param {string} selector
   * @returns {Promise<import('playwright-core').ElementHandle<HTMLElement | SVGElement>[]>}
   * @override
   * @protected
   */
  getAllRawElements(selector) {
    if ('$$' in this.rawRootElement) {
      return this.rawRootElement.$$(
        this.respectShadowBoundaries
          ? `css:light=${selector}`
          : `css=${selector}`,
      );
    } else {
      return /** @type {Promise<import('playwright-core').ElementHandle<HTMLElement | SVGElement>[]>} */ (
        this.rawRootElement
          .locator(
            this.respectShadowBoundaries
              ? `css:light=${selector}`
              : `css=${selector}`,
          )
          .elementHandles()
      );
    }
  }
}
