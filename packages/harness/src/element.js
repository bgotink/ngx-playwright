import {TestKey} from '@angular/cdk/testing';

/** @typedef {import('@angular/cdk/testing').ElementDimensions} ElementDimensions */
/** @typedef {import('@angular/cdk/testing').EventData} EventData */
/** @typedef {import('@angular/cdk/testing').ModifierKeys} ModifierKeys */
/** @typedef {import('@angular/cdk/testing').TestElement} TestElement */
/** @typedef {import('@angular/cdk/testing').TextOptions} TextOptions */
/** @template [T=Node] @typedef {import('@playwright/test').ElementHandle<T>} ElementHandle */
/** @typedef {import('@playwright/test').Locator} Locator */
/** @typedef {import('@playwright/test').Page} Page */

import {
  blur,
  dispatchEvent,
  getBoundingClientRect,
  getStyleProperty,
  getTextWithExcludedElements,
  matches,
} from './browser.js';

/**
 * @type {Map<TestKey, string>}
 */
const keyMap = new Map([
  [TestKey.ALT, 'Alt'],
  [TestKey.BACKSPACE, 'Backspace'],
  [TestKey.CONTROL, 'Control'],
  [TestKey.DELETE, 'Delete'],
  [TestKey.DOWN_ARROW, 'ArrowDown'],
  [TestKey.END, 'End'],
  [TestKey.ENTER, 'Enter'],
  [TestKey.ESCAPE, 'Escape'],
  [TestKey.F1, 'F1'],
  [TestKey.F2, 'F2'],
  [TestKey.F3, 'F3'],
  [TestKey.F4, 'F4'],
  [TestKey.F5, 'F5'],
  [TestKey.F6, 'F6'],
  [TestKey.F7, 'F7'],
  [TestKey.F8, 'F8'],
  [TestKey.F9, 'F9'],
  [TestKey.F10, 'F10'],
  [TestKey.F11, 'F11'],
  [TestKey.F12, 'F12'],
  [TestKey.HOME, 'Home'],
  [TestKey.INSERT, 'Insert'],
  [TestKey.LEFT_ARROW, 'ArrowLeft'],
  [TestKey.META, 'Meta'],
  [TestKey.PAGE_DOWN, 'PageDown'],
  [TestKey.PAGE_UP, 'PageUp'],
  [TestKey.RIGHT_ARROW, 'ArrowRight'],
  [TestKey.SHIFT, 'Shift'],
  [TestKey.TAB, 'Tab'],
  [TestKey.UP_ARROW, 'ArrowUp'],
]);

const modifierMapping = /** @type {const} */ ([
  ['alt', 'Alt'],
  ['shift', 'Shift'],
  ['meta', 'Meta'],
  ['control', 'Control'],
]);

/**
 * @param {ModifierKeys} modifiers
 */
function getModifiers(modifiers) {
  return modifierMapping
    .filter(([modifier]) => modifiers[modifier])
    .map(([, modifier]) => modifier);
}

/**
 * @param {(string | TestKey)[] | [ModifierKeys, ...(string | TestKey)[]]} keys
 * @returns {keys is [ModifierKeys, ...(string | TestKey)[]]}
 */
function hasModifiers(keys) {
  return typeof keys[0] === 'object';
}

/**
 * @template {unknown[]} T
 * @param {T} args
 * @returns {args is T & ['center', ...unknown[]]}
 */
function isCenterClick(args) {
  return args[0] === 'center';
}

/**
 * @param {ClickParameters} args
 * @returns {args is [number, number, ModifierKeys?]}
 */
function isPositionedClick(args) {
  return typeof args[0] === 'number';
}

/**
 * @typedef {[ModifierKeys?] | ['center', ModifierKeys?] | [number, number, ModifierKeys?]} ClickParameters
 */

/**
 *
 * @param {ElementHandle<unknown> | Locator} handleOrLocator
 * @returns {handleOrLocator is Locator}
 */
export function isLocator(handleOrLocator) {
  return !('$$' in handleOrLocator);
}

/**
 * `TestElement` implementation backed by playwright's `ElementHandle`
 *
 * @internal
 * @implements TestElement
 */
export class PlaywrightElement {
  /**
   * The page the element is on
   *
   * @readonly
   * @type {() => Page}
   */
  #page;

  /**
   * Awaits for the angular app to become stable
   *
   * This function has to be called after every manipulation and before any query
   *
   * @readonly
   * @type {<T>(fn: (handle: ElementHandle<HTMLElement | SVGElement>) => Promise<T>) => Promise<T>}
   */
  #query;

  /**
   * Awaits for the angular app to become stable
   *
   * This function has to be called after every manipulation and before any query
   *
   * @readonly
   * @type {(fn: (handle: ElementHandle<HTMLElement | SVGElement>) => Promise<void>) => Promise<void>}
   */
  #perform;

  /**
   * @param {() => Page} page
   * @param {ElementHandle<HTMLElement | SVGElement> | Locator} handleOrLocator
   * @param {() => Promise<void>} whenStable
   */
  constructor(page, handleOrLocator, whenStable) {
    this.#page = page;

    /** @type {() => Promise<ElementHandle<HTMLElement | SVGElement>>} */
    let getHandle;
    if (isLocator(handleOrLocator)) {
      // Only one case where we are passed a Locator: the root element of the page, which is always
      // present -> we can safely ignore the null return type
      getHandle = async () =>
        /** @type {ElementHandle<HTMLElement | SVGElement>} */ (
          await handleOrLocator.elementHandle()
        );
    } else {
      getHandle = async () => handleOrLocator;
    }

    this.#query = async fn => {
      await whenStable();
      return fn(await getHandle());
    };

    this.#perform = async fn => {
      try {
        return fn(await getHandle());
      } finally {
        await whenStable();
      }
    };
  }

  /**
   *
   * @param  {ClickParameters} args
   * @returns {Promise<Parameters<ElementHandle['click']>[0]>}
   */
  #toClickOptions = async (...args) => {
    /** @type {Parameters<ElementHandle['click']>[0]} */
    const clickOptions = {};
    /** @type {ModifierKeys | undefined} */
    let modifierKeys;

    if (isCenterClick(args)) {
      const size = await this.getDimensions();

      clickOptions.position = {
        x: size.width / 2,
        y: size.height / 2,
      };

      modifierKeys = args[1];
    } else if (isPositionedClick(args)) {
      clickOptions.position = {x: args[0], y: args[1]};
      modifierKeys = args[2];
    } else {
      modifierKeys = args[0];
    }

    if (modifierKeys) {
      clickOptions.modifiers = getModifiers(modifierKeys);
    }

    return clickOptions;
  };

  /**
   * @returns {Promise<void>}
   */
  blur() {
    // Playwright exposes a `focus` function but no `blur` function, so we have
    // to resort to executing a function ourselves.
    return this.#perform(handle => handle.evaluate(blur));
  }

  /**
   * @returns {Promise<void>}
   */
  clear() {
    return this.#perform(handle => handle.fill(''));
  }

  /**
   * @param {ClickParameters} args
   * @returns {Promise<void>}
   */
  click(...args) {
    return this.#perform(async handle =>
      handle.click(await this.#toClickOptions(...args)),
    );
  }

  /**
   * @param {ClickParameters} args
   * @returns {Promise<void>}
   */
  rightClick(...args) {
    return this.#perform(async handle =>
      handle.click({
        ...(await this.#toClickOptions(...args)),
        button: 'right',
      }),
    );
  }

  /**
   * @param {string} name
   * @param {Record<string, EventData>=} data
   * @returns {Promise<void>}
   */
  dispatchEvent(name, data) {
    // ElementHandle#dispatchEvent executes the equivalent of
    //   `element.dispatchEvent(new CustomEvent(name, {detail: data}))`
    // which doesn't match what angular wants: `data` are properties to be
    // placed on the event directly rather than on the `details` property

    return this.#perform(handle =>
      // Cast to `any` needed because of infinite type instantiation
      handle.evaluate(
        dispatchEvent,
        /** @type {[string, any]} */ ([name, data]),
      ),
    );
  }

  /**
   * @returns {Promise<void>}
   */
  focus() {
    return this.#perform(handle => handle.focus());
  }

  /**
   * @param {string} property
   * @returns {Promise<string>}
   */
  async getCssValue(property) {
    return this.#query(handle => handle.evaluate(getStyleProperty, property));
  }

  /**
   * @returns {Promise<void>}
   */
  async hover() {
    return this.#perform(handle => handle.hover());
  }

  /**
   * @returns {Promise<void>}
   */
  async mouseAway() {
    const {left, top} = await this.#query(async handle => {
      let {left, top} = await handle.evaluate(getBoundingClientRect);

      if (left < 0 && top < 0) {
        await handle.scrollIntoViewIfNeeded();
        ({left, top} = await handle.evaluate(getBoundingClientRect));
      }

      return {left, top};
    });

    return this.#perform(() =>
      this.#page().mouse.move(Math.max(0, left - 1), Math.max(0, top - 1)),
    );
  }

  /**
   *
   * @param  {...number} optionIndexes
   * @returns {Promise<void>}
   */
  selectOptions(...optionIndexes) {
    // ElementHandle#selectOption supports selecting multiple options at once,
    // but that triggers only one change event.
    // So we select options as if we're a user: one at a time

    return this.#perform(async handle => {
      /** @type {{index: number}[]} */
      const selections = [];
      for (const index of optionIndexes) {
        selections.push({index});
        await handle.selectOption(selections);
      }
    });
  }

  /**
   *
   * @param  {(string | TestKey)[] | [ModifierKeys, ...(string | TestKey)[]]} keys
   * @returns {Promise<void>}
   */
  sendKeys(...keys) {
    /** @type {string | undefined} */
    let modifiers;
    if (hasModifiers(keys)) {
      /** @type {ModifierKeys} */
      let modifiersObject;
      [modifiersObject, ...keys] = keys;

      modifiers = getModifiers(modifiersObject).join('+');
    }

    return this.#perform(async handle => {
      await handle.focus();

      const {keyboard} = this.#page();

      if (modifiers) {
        await keyboard.down(modifiers);
      }

      try {
        for (const key of /** @type {(string | TestKey)[]} */ (keys)) {
          if (typeof key === 'string') {
            await keyboard.type(key);
          } else if (keyMap.has(key)) {
            await keyboard.press(/** @type {string} */ (keyMap.get(key)));
          } else {
            throw new Error(`Unknown key: ${TestKey[key] ?? key}`);
          }
        }
      } finally {
        if (modifiers) {
          await keyboard.up(modifiers);
        }
      }
    });
  }

  /**
   * @param {string} value
   * @returns {Promise<void>}
   */
  setInputValue(value) {
    return this.#perform(handle => handle.fill(value));
  }

  /**
   * @param {TextOptions=} options
   * @returns {Promise<string>}
   */
  text(options) {
    return this.#query(handle => {
      if (options?.exclude) {
        return handle.evaluate(getTextWithExcludedElements, options.exclude);
      }

      return handle.innerText();
    });
  }

  /**
   * @param {string} name
   * @returns {Promise<string | null>}
   */
  getAttribute(name) {
    return this.#query(handle => handle.getAttribute(name));
  }

  /**
   * @param {string} name
   * @returns {Promise<boolean>}
   */
  async hasClass(name) {
    const classes =
      (await this.#query(handle => handle.getAttribute('class')))?.split(
        /\s+/,
      ) ?? [];

    return classes.includes(name);
  }

  /**
   * @returns {Promise<ElementDimensions>}
   */
  async getDimensions() {
    return this.#query(handle => handle.evaluate(getBoundingClientRect));
  }

  /**
   * @param {string} name
   * @returns {Promise<any>}
   */
  async getProperty(name) {
    const property = await this.#query(handle => handle.getProperty(name));

    try {
      return await property.jsonValue();
    } finally {
      await property.dispose();
    }
  }

  /**
   * @param {string} selector
   * @returns {Promise<boolean>}
   */
  async matchesSelector(selector) {
    return this.#query(handle => handle.evaluate(matches, selector));
  }

  /**
   * @returns {Promise<boolean>}
   */
  async isFocused() {
    return this.matchesSelector(':focus');
  }
}
