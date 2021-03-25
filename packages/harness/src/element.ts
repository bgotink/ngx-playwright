import type {ElementHandle} from 'playwright-core';
import {
  ElementDimensions,
  ModifierKeys,
  TestElement,
  TestKey,
  TextOptions,
} from '@angular/cdk/testing';

import {
  blur,
  getBoundingClientRect,
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

const typingModifiers = [
  ['alt', 'Alt'],
  ['shift', 'Shift'],
  ['meta', 'Meta'],
  ['control', 'Control'],
] as const;

function hasModifiers(
  keys: (string | TestKey)[] | [ModifierKeys, ...(string | TestKey)[]],
): keys is [ModifierKeys, ...(string | TestKey)[]] {
  return typeof keys[0] === 'object';
}

/**
 * `TestElement` implementation backed by playwright's `ElementHandle`
 *
 * @internal
 */
export class PlaywrightElement implements TestElement {
  public constructor(
    readonly handle: ElementHandle<HTMLElement | SVGElement>,
  ) {}

  async blur(): Promise<void> {
    // Playwright exposes a `focus` function but no `blur` function, so we have
    // to resort to executing a function ourselves.
    await this.handle.evaluate(blur);
  }

  async clear(): Promise<void> {
    await this.handle.fill('');
  }

  click(): Promise<void>;
  click(location: 'center'): Promise<void>;
  click(relativeX: number, relativeY: number): Promise<void>;
  async click(...args: [] | ['center'] | [number, number]) {
    switch (args.length) {
      case 0:
        await this.handle.click();
        break;

      case 1:
        {
          const size = await this.getDimensions();

          await this.handle.click({
            position: {
              x: size.width / 2,
              y: size.height / 2,
            },
          });
        }
        break;

      case 2:
        await this.handle.click({position: {x: args[0], y: args[1]}});
    }
  }

  async focus(): Promise<void> {
    await this.handle.focus();
  }

  async getCssValue(property: string): Promise<string> {
    return this.handle.evaluate(
      (element, property) => element.style.getPropertyValue(property),
      property,
    );
  }

  async hover(): Promise<void> {
    await this.handle.hover();
  }

  mouseAway(): Promise<void> {
    throw new Error('Method not implemented.');
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

      modifiers = typingModifiers
        .filter(([property]) => modifiersObject[property])
        .map(([, key]) => key)
        .join('+');
    }

    const {keyboard} = (await this.handle.ownerFrame())?.page() || {};

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

  async text(options?: TextOptions): Promise<string> {
    if (options?.exclude) {
      return this.handle.evaluate(getTextWithExcludedElements, options.exclude);
    }

    return (await this.handle.textContent()) ?? '';
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
      property.dispose();
    }
  }

  async matchesSelector(selector: string): Promise<boolean> {
    return this.handle.evaluate(matches, selector);
  }

  async isFocused(): Promise<boolean> {
    return this.matchesSelector(':focus');
  }
}
