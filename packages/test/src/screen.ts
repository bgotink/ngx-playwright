import type {
  AsyncFactoryFn,
  ComponentHarness,
  ComponentHarnessConstructor,
} from '@angular/cdk/testing';
import type {PlaywrightHarnessEnvironment} from '@ngx-playwright/harness';
import type {Page} from '@playwright/test';

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

type ExtractablePropertyNamesOfScreen<T extends ComponentHarness> = {
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
