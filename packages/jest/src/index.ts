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

export type ExtractablePropertiesOfScreen<T extends ComponentHarness> = {
  [K in keyof T]: T[K] extends AsyncFactoryFn<infer P> ? P : never;
};
