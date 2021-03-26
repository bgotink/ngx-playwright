import type {ElementHandle} from 'playwright-core';
import {
  ElementDimensions,
  EventData,
  ModifierKeys,
  TestElement,
  TestKey,
  TextOptions,
} from '@angular/cdk/testing';

import {
  blur,
  getBoundingClientRect,
  getStyleProperty,
  getTextWithExcludedElements,
  matches,
} from './browser';

const keyMap = new Map<TestKey, string>([
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

const modifierMapping = [
  ['alt', 'Alt'],
  ['shift', 'Shift'],
  ['meta', 'Meta'],
  ['control', 'Control'],
] as const;

// prettier-ignore
function getModifiers(
  modifiers: ModifierKeys,
): (typeof modifierMapping[0 | 1 | 2 | 3][1])[] {
  return modifierMapping
    .filter(([modifier]) => modifiers[modifier])
    .map(([, modifier]) => modifier);
}

function hasModifiers(
  keys: (string | TestKey)[] | [ModifierKeys, ...(string | TestKey)[]],
): keys is [ModifierKeys, ...(string | TestKey)[]] {
  return typeof keys[0] === 'object';
}

function isCenterClick<T extends unknown[]>(
  args: T,
): args is T & ['center', ...unknown[]] {
  return args[0] === 'center';
}

function isPositionedClick<T extends unknown[]>(
  args: T,
): args is T & [number, ...unknown[]] {
  return typeof args[0] === 'number';
}

type ClickParameters =
  | [ModifierKeys?]
  | ['center', ModifierKeys?]
  | [number, number, ModifierKeys?];

/**
 * `TestElement` implementation backed by playwright's `ElementHandle`
 *
 * @internal
 */
export class PlaywrightElement implements TestElement {
  public constructor(
    readonly handle: ElementHandle<HTMLElement | SVGElement>,
  ) {}

  #getPage = async () => {
    const page = await (await this.handle.ownerFrame())?.page();

    if (page == null) {
      throw new Error('Expected element to be attached to a page');
    }

    return page;
  };

  #toClickOptions = async (
    ...args: ClickParameters
  ): Promise<Parameters<ElementHandle['click']>[0]> => {
    const clickOptions: Parameters<ElementHandle['click']>[0] = {};
    let modifierKeys: ModifierKeys | undefined;

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

  async blur(): Promise<void> {
    // Playwright exposes a `focus` function but no `blur` function, so we have
    // to resort to executing a function ourselves.
    await this.handle.evaluate(blur);
  }

  async clear(): Promise<void> {
    await this.handle.fill('');
  }

  click(modifierKeys?: ModifierKeys): Promise<void>;
  click(location: 'center', modifierKeys?: ModifierKeys): Promise<void>;
  click(
    relativeX: number,
    relativeY: number,
    modifierKeys?: ModifierKeys,
  ): Promise<void>;
  async click(...args: ClickParameters) {
    await this.handle.click(await this.#toClickOptions(...args));
  }

  rightClick(modifierKeys?: ModifierKeys): Promise<void>;
  rightClick(location: 'center', modifierKeys?: ModifierKeys): Promise<void>;
  rightClick(
    relativeX: number,
    relativeY: number,
    modifierKeys?: ModifierKeys,
  ): Promise<void>;
  async rightClick(...args: ClickParameters): Promise<void> {
    await this.handle.click({
      ...(await this.#toClickOptions(...args)),
      button: 'right',
    });
  }

  async dispatchEvent(
    name: string,
    data?: Record<string, EventData>,
  ): Promise<void> {
    await this.handle.dispatchEvent(name, data);
  }

  async focus(): Promise<void> {
    await this.handle.focus();
  }

  async getCssValue(property: string): Promise<string> {
    return this.handle.evaluate(getStyleProperty, property);
  }

  async hover(): Promise<void> {
    await this.handle.hover();
  }

  async mouseAway(): Promise<void> {
    const {mouse} = await this.#getPage();
    let {left, top} = await this.getDimensions();

    if (left < 0 && top < 0) {
      await this.handle.scrollIntoViewIfNeeded();
      ({left, top} = await this.getDimensions());
    }

    await mouse.move(Math.max(0, left - 1), Math.max(0, top - 1));
  }

  async selectOptions(...optionIndexes: number[]): Promise<void> {
    await this.handle.selectOption(optionIndexes.map(index => ({index})));
  }

  sendKeys(...keys: (string | TestKey)[]): Promise<void>;
  sendKeys(
    modifiers: ModifierKeys,
    ...keys: (string | TestKey)[]
  ): Promise<void>;
  async sendKeys(
    ...keys: (string | TestKey)[] | [ModifierKeys, ...(string | TestKey)[]]
  ) {
    let modifiers: string | undefined;
    if (hasModifiers(keys)) {
      let modifiersObject: ModifierKeys;
      [modifiersObject, ...keys] = keys;

      modifiers = getModifiers(modifiersObject).join('+');
    }

    await this.handle.focus();

    const {keyboard} = await this.#getPage();

    if (keyboard == null) {
      throw new Error(`Expected element to be shown on the page`);
    }

    if (modifiers) {
      await keyboard.down(modifiers);
    }

    try {
      for (const key of keys as (string | TestKey)[]) {
        if (typeof key === 'string') {
          await keyboard.type(key);
        } else if (keyMap.has(key)) {
          await keyboard.press(keyMap.get(key)!);
        } else {
          throw new Error(`Unknown key: ${TestKey[key] ?? key}`);
        }
      }
    } finally {
      if (modifiers) {
        await keyboard.up(modifiers);
      }
    }
  }

  async setInputValue(value: string): Promise<void> {
    await this.handle.fill(value);
  }

  async text(options?: TextOptions): Promise<string> {
    if (options?.exclude) {
      return this.handle.evaluate(getTextWithExcludedElements, options.exclude);
    }

    return this.handle.innerText();
  }

  getAttribute(name: string): Promise<string | null> {
    return this.handle.getAttribute(name);
  }

  async hasClass(name: string): Promise<boolean> {
    const classes =
      (await this.handle.getAttribute('class'))?.split(/\s+/) ?? [];

    return classes.includes(name);
  }

  async getDimensions(): Promise<ElementDimensions> {
    return this.handle.evaluate(getBoundingClientRect);
  }

  async getProperty(name: string): Promise<any> {
    const property = await this.handle.getProperty(name);

    try {
      return await property.jsonValue();
    } finally {
      await property.dispose();
    }
  }

  async matchesSelector(selector: string): Promise<boolean> {
    return this.handle.evaluate(matches, selector);
  }

  async isFocused(): Promise<boolean> {
    return this.matchesSelector(':focus');
  }
}
