import type {
  AsyncFactoryFn,
  ComponentHarness,
  ComponentHarnessConstructor,
} from '@angular/cdk/testing';
import type {Page} from 'playwright-core';

export interface PlaywrightScreenWithPath<T extends ComponentHarness>
  extends ComponentHarnessConstructor<T> {
  readonly path: string;
}

export interface PlaywrightScreenWithOpenFunction<T extends ComponentHarness>
  extends ComponentHarnessConstructor<T> {
  open(page: Page, baseUrl: string): Promise<void>;
}

export type PlaywrightScreen<T extends ComponentHarness> =
  | PlaywrightScreenWithOpenFunction<T>
  | PlaywrightScreenWithPath<T>;

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
