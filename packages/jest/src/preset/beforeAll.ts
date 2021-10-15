// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../global.d.ts" />

import {
  ComponentHarness,
  HarnessEnvironment,
  parallel,
} from '@angular/cdk/testing';
import {
  createEnvironment,
  manuallyStabilize as _manuallyStabilize,
  autoStabilize as _autoStabilize,
  isAutoStabilizing,
} from '@ngx-playwright/harness';
import type {Page} from 'playwright-core';

import type {
  PlaywrightScreen,
  ExtractablePropertiesOfScreen,
  PlaywrightScreenWithOpenFunction,
} from '..';
import {getDestructuredArguments} from '../utils/parse-arguments';

const cachedEnvironments = new WeakMap<Page, HarnessEnvironment<unknown>>();

function getOrCreateEnvironment(page: Page): HarnessEnvironment<unknown> {
  let environment = cachedEnvironments.get(page);

  if (environment == null) {
    environment = createEnvironment(page);
    cachedEnvironments.set(page, environment);
  }

  return environment;
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return !!value && typeof (value as Promise<unknown>).then === 'function';
}

Object.defineProperty(globalThis, 'harnessEnvironment', {
  configurable: true,
  get: () => getOrCreateEnvironment(page),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
global.autoStabilize = (fn?: () => unknown): any => {
  if (!fn) {
    _autoStabilize();
    return;
  }

  return () => {
    if (isAutoStabilizing()) {
      // already automatically stabilizing
      return fn();
    }

    _autoStabilize();
    let isPromise = false;
    try {
      const result = fn();

      if (isPromiseLike(result)) {
        isPromise = true;
        return Promise.resolve(result).finally(() => manuallyStabilize());
      } else {
        return result;
      }
    } finally {
      if (!isPromise) {
        manuallyStabilize();
      }
    }
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
global.manuallyStabilize = (fn?: () => unknown): any => {
  if (!fn) {
    _manuallyStabilize();
    return;
  }

  return () => {
    if (!isAutoStabilizing()) {
      // already manually stabilizing
      return fn();
    }

    _manuallyStabilize();
    let isPromise = false;
    try {
      const result = fn();

      if (isPromiseLike(result)) {
        isPromise = true;
        return Promise.resolve(result).finally(() => autoStabilize());
      } else {
        return result;
      }
    } finally {
      if (!isPromise) {
        autoStabilize();
      }
    }
  };
};

function inScreen<T extends ComponentHarness>(
  page: Page,
  screen: PlaywrightScreen<T>,
  fn: (
    props: ExtractablePropertiesOfScreen<T>,
    screen: T,
  ) => void | Promise<void>,
): () => Promise<void>;
function inScreen<T extends ComponentHarness>(
  screen: PlaywrightScreen<T>,
  fn: (
    props: ExtractablePropertiesOfScreen<T>,
    screen: T,
  ) => void | Promise<void>,
): () => Promise<void>;
function inScreen<T extends ComponentHarness>(
  pageOrScreen: Page | PlaywrightScreen<T>,
  screenOrFn:
    | PlaywrightScreen<T>
    | ((
        props: ExtractablePropertiesOfScreen<T>,
        screen: T,
      ) => void | Promise<void>),
  fn?: (
    props: ExtractablePropertiesOfScreen<T>,
    screen: T,
  ) => void | Promise<void>,
): () => Promise<void> {
  let page: Page;
  let Screen: PlaywrightScreen<T>;
  let testFunction: (
    props: ExtractablePropertiesOfScreen<T>,
    screen: T,
  ) => void | Promise<void>;

  if (typeof pageOrScreen === 'function') {
    // @ts-expect-error Somehow global.page can't be found
    page = global.page;
    Screen = pageOrScreen;
    testFunction = screenOrFn as (
      props: ExtractablePropertiesOfScreen<T>,
      screen: T,
    ) => void | Promise<void>;
  } else {
    page = pageOrScreen;
    Screen = screenOrFn as PlaywrightScreen<T>;
    testFunction = fn!;
  }

  const args = getDestructuredArguments(
    testFunction,
  ) as (keyof ExtractablePropertiesOfScreen<T>)[];

  return async function () {
    await openScreen(Screen, page, baseUrl);
    const screen = await getOrCreateEnvironment(page).getHarness(Screen);

    if (args == null) {
      await testFunction({} as ExtractablePropertiesOfScreen<T>, screen);
    } else {
      const properties = await parallel(() =>
        args.map(async name => {
          // @ts-expect-error keyof T _can_ in fact index ExtractablePropertiesOfScreen<T>
          const value: ExtractablePropertiesOfScreen<T>[keyof T] = await screen[
            name
          ]?.();

          return [name, value] as const;
        }),
      );

      await testFunction(
        Object.fromEntries(properties) as ExtractablePropertiesOfScreen<T>,
        screen,
      );
    }
  };
}

function hasOpenFunction(
  screen: PlaywrightScreen<ComponentHarness>,
): screen is PlaywrightScreenWithOpenFunction<ComponentHarness> {
  return (
    typeof (screen as PlaywrightScreenWithOpenFunction<ComponentHarness>)
      .open === 'function'
  );
}

function openScreen(
  screen: PlaywrightScreen<ComponentHarness>,
  page: Page,
  baseUrl: string,
) {
  if (hasOpenFunction(screen)) {
    return screen.open(page, baseUrl);
  } else {
    return page.goto(new URL(screen.path, baseUrl).href);
  }
}

global.inScreen = inScreen;

autoStabilize();
