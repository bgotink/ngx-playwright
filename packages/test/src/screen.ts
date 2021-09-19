import {
  AsyncFactoryFn,
  ComponentHarness,
  ComponentHarnessConstructor,
  parallel,
} from '@angular/cdk/testing';
import {
  createEnvironment,
  PlaywrightHarnessEnvironment,
} from '@ngx-playwright/harness';
import type {Page} from '@playwright/test';

import {getDestructuredArguments} from './parse-arguments';

export interface PlaywrightScreenWithPath<T extends ComponentHarness>
  extends ComponentHarnessConstructor<T> {
  readonly path: string;
}

export interface PlaywrightScreenWithOpenFunction<T extends ComponentHarness>
  extends ComponentHarnessConstructor<T> {
  open(
    page: Page,
    baseUrl: string,
    opener: PlaywrightScreenOpener,
  ): Promise<void>;
}

export type PlaywrightScreen<T extends ComponentHarness> =
  | PlaywrightScreenWithOpenFunction<T>
  | PlaywrightScreenWithPath<T>;

export interface PlaywrightScreenOpener {
  <T extends ComponentHarness>(screen: PlaywrightScreen<T>): Promise<T>;
}

function hasOpenFunction(
  screen: PlaywrightScreen<ComponentHarness>,
): screen is PlaywrightScreenWithOpenFunction<ComponentHarness> {
  return (
    typeof (screen as PlaywrightScreenWithOpenFunction<ComponentHarness>)
      .open === 'function'
  );
}

export async function openScreen<T extends ComponentHarness>(
  baseURL: string | undefined,
  page: Page,
  harnessEnvironment: PlaywrightHarnessEnvironment,
  screen: PlaywrightScreen<T>,
): Promise<T> {
  if (baseURL == null) {
    throw new Error(
      'Expected baseURL to be set, did you run via @ngx-playwright/test:run?',
    );
  }

  if (hasOpenFunction(screen)) {
    await screen.open(page, baseURL, screen =>
      openScreen(baseURL, page, harnessEnvironment, screen),
    );
  } else {
    await page.goto(new URL(screen.path, baseURL).href);
  }

  return harnessEnvironment.getHarness(screen);
}

export interface InScreenFn {
  /**
   * [experimental] Open the given screen and execute the given function
   *
   * @param page Page to open the screen in
   * @param screen The screen to open
   * @param fn Function to execute once the given screen is opened
   */
  <T extends ComponentHarness>(
    page: Page,
    screen: PlaywrightScreen<T>,
    fn: (
      props: ExtractablePropertiesOfScreen<T>,
      screen: T,
    ) => void | Promise<void>,
  ): Promise<void>;

  /**
   * [experimental] Open the given screen and execute the given function
   *
   * @param screen The screen to open
   * @param fn Function to execute once the given screen is opened
   */
  <T extends ComponentHarness>(
    screen: PlaywrightScreen<T>,
    fn: (
      props: ExtractablePropertiesOfScreen<T>,
      screen: T,
    ) => void | Promise<void>,
  ): Promise<void>;
}

export function createInScreenFn(
  page: Page,
  harnessEnvironment: PlaywrightHarnessEnvironment,
  baseURL: string | undefined,
): InScreenFn {
  function inScreen<T extends ComponentHarness>(
    page: Page,
    screen: PlaywrightScreen<T>,
    fn: (
      props: ExtractablePropertiesOfScreen<T>,
      screen: T,
    ) => void | Promise<void>,
  ): Promise<void>;
  function inScreen<T extends ComponentHarness>(
    screen: PlaywrightScreen<T>,
    fn: (
      props: ExtractablePropertiesOfScreen<T>,
      screen: T,
    ) => void | Promise<void>,
  ): Promise<void>;
  async function inScreen<T extends ComponentHarness>(
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
  ): Promise<void> {
    let _page: Page;
    let Screen: PlaywrightScreen<T>;
    let testFunction: (
      props: ExtractablePropertiesOfScreen<T>,
      screen: T,
    ) => void | Promise<void>;

    if (typeof pageOrScreen === 'function') {
      _page = page;
      Screen = pageOrScreen;
      testFunction = screenOrFn as (
        props: ExtractablePropertiesOfScreen<T>,
        screen: T,
      ) => void | Promise<void>;
    } else {
      _page = pageOrScreen;
      Screen = screenOrFn as PlaywrightScreen<T>;
      testFunction = fn!;
    }

    const args = getDestructuredArguments(
      testFunction,
    ) as (keyof ExtractablePropertiesOfScreen<T>)[];

    const _harnessEnvironment =
      _page === page ? harnessEnvironment : createEnvironment(_page);
    const screen = await openScreen(
      baseURL,
      _page,
      _harnessEnvironment,
      Screen,
    );

    if (args == null) {
      await testFunction({} as ExtractablePropertiesOfScreen<T>, screen);
    } else {
      const properties = await parallel(() =>
        args.map(async name => {
          // @ts-expect-error typescript doesn't realise ExtractablePropertiesOfScreen<T> is indexable by keyof T
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
  }

  return inScreen;
}

export type ExtractablePropertyNamesOfScreen<T extends ComponentHarness> = {
  [K in keyof T]: T[K] extends AsyncFactoryFn<unknown> ? K : never;
}[keyof T];

export type ExtractablePropertiesOfScreen<T extends ComponentHarness> = {
  // Once updated to angular 12 (typescript 4.2) replace the intermediary type with
  // [K in ExtractablePropertyNamesOfScreen<T> as T[K] extends AsyncFactoryFn<unknown> ? K : never]
  [K in ExtractablePropertyNamesOfScreen<T>]: T[K] extends AsyncFactoryFn<
    infer P
  >
    ? P
    : never;
};
