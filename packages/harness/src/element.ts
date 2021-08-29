import {
  ElementDimensions,
  EventData,
  ModifierKeys,
  TestElement,
  TestKey,
  TextOptions,
} from '@angular/cdk/testing';
import type {ElementHandle, Page} from 'playwright-core';

import {
  blur,
  dispatchEvent,
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
  /**
   * The page the element is on
   */
  readonly #page: () => Page;

  /**
   * Awaits for the angular app to become stable
   *
   * This function has to be called after every manipulation and before any query
   */
  readonly #query: <T>(
    fn: (handle: ElementHandle<HTMLElement | SVGElement>) => Promise<T>,
  ) => Promise<T>;

  /**
   * Awaits for the angular app to become stable
   *
   * This function has to be called after every manipulation and before any query
   */
  readonly #perform: (
    fn: (handle: ElementHandle<HTMLElement | SVGElement>) => Promise<void>,
  ) => Promise<void>;

  public constructor(
    page: () => Page,
    handle: ElementHandle<HTMLElement | SVGElement>,
    whenStable: () => Promise<void>,
  ) {
    this.#page = page;

    this.#query = async fn => {
      await whenStable();
      return fn(handle);
    };

    this.#perform = async fn => {
      try {
        return fn(handle);
      } finally {
        await whenStable();
      }
    };
  }

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

  blur(): Promise<void> {
    // Playwright exposes a `focus` function but no `blur` function, so we have
    // to resort to executing a function ourselves.
    return this.#perform(handle => handle.evaluate(blur));
  }

  clear(): Promise<void> {
    return this.#perform(handle => handle.fill(''));
  }

  click(modifierKeys?: ModifierKeys): Promise<void>;
  click(location: 'center', modifierKeys?: ModifierKeys): Promise<void>;
  click(
    relativeX: number,
    relativeY: number,
    modifierKeys?: ModifierKeys,
  ): Promise<void>;
  click(...args: ClickParameters): Promise<void> {
    return this.#perform(async handle =>
      handle.click(await this.#toClickOptions(...args)),
    );
  }

  rightClick(modifierKeys?: ModifierKeys): Promise<void>;
  rightClick(location: 'center', modifierKeys?: ModifierKeys): Promise<void>;
  rightClick(
    relativeX: number,
    relativeY: number,
    modifierKeys?: ModifierKeys,
  ): Promise<void>;
  rightClick(...args: ClickParameters): Promise<void> {
    return this.#perform(async handle =>
      handle.click({
        ...(await this.#toClickOptions(...args)),
        button: 'right',
      }),
    );
  }

  dispatchEvent(name: string, data?: Record<string, EventData>): Promise<void> {
    // ElementHandle#dispatchEvent executes the equivalent of
    //   `element.dispatchEvent(new CustomEvent(name, {detail: data}))`
    // which doesn't match what angular wants: `data` are properties to be
    // placed on the event directly rather than on the `details` property

    return this.#perform(handle =>
      // Cast to `any` needed because of infinite type instantiation
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handle.evaluate(dispatchEvent, [name, data] as [string, any]),
    );
  }

  focus(): Promise<void> {
    return this.#perform(handle => handle.focus());
  }

  async getCssValue(property: string): Promise<string> {
    return this.#query(handle => handle.evaluate(getStyleProperty, property));
  }

  async hover(): Promise<void> {
    return this.#perform(handle => handle.hover());
  }

  async mouseAway(): Promise<void> {
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

  selectOptions(...optionIndexes: number[]): Promise<void> {
    // ElementHandle#selectOption supports selecting multiple options at once,
    // but that triggers only one change event.
    // So we select options as if we're a user: one at a time

    return this.#perform(async handle => {
      const selections: {index: number}[] = [];
      for (const index of optionIndexes) {
        selections.push({index});
        await handle.selectOption(selections);
      }
    });
  }

  sendKeys(...keys: (string | TestKey)[]): Promise<void>;
  sendKeys(
    modifiers: ModifierKeys,
    ...keys: (string | TestKey)[]
  ): Promise<void>;
  sendKeys(
    ...keys: (string | TestKey)[] | [ModifierKeys, ...(string | TestKey)[]]
  ): Promise<void> {
    let modifiers: string | undefined;
    if (hasModifiers(keys)) {
      let modifiersObject: ModifierKeys;
      // eslint-disable-next-line prefer-const
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
    });
  }

  setInputValue(value: string): Promise<void> {
    return this.#perform(handle => handle.fill(value));
  }

  text(options?: TextOptions): Promise<string> {
    return this.#query(handle => {
      if (options?.exclude) {
        return handle.evaluate(getTextWithExcludedElements, options.exclude);
      }

      return handle.innerText();
    });
  }

  getAttribute(name: string): Promise<string | null> {
    return this.#query(handle => handle.getAttribute(name));
  }

  async hasClass(name: string): Promise<boolean> {
    const classes =
      (await this.#query(handle => handle.getAttribute('class')))?.split(
        /\s+/,
      ) ?? [];

    return classes.includes(name);
  }

  async getDimensions(): Promise<ElementDimensions> {
    return this.#query(handle => handle.evaluate(getBoundingClientRect));
  }

  // Any required by interface
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getProperty(name: string): Promise<any> {
    const property = await this.#query(handle => handle.getProperty(name));

    try {
      return await property.jsonValue();
    } finally {
      await property.dispose();
    }
  }

  async matchesSelector(selector: string): Promise<boolean> {
    return this.#query(handle => handle.evaluate(matches, selector));
  }

  async isFocused(): Promise<boolean> {
    return this.matchesSelector(':focus');
  }
}
