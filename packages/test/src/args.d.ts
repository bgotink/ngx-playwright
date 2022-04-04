import {ComponentHarness} from '@angular/cdk/testing';
import {PlaywrightHarnessEnvironment} from '@ngx-playwright/harness';
import {
  Fixtures,
  PlaywrightTestArgs,
  PlaywrightTestConfig as BaseTestConfig,
  PlaywrightTestOptions,
  PlaywrightWorkerArgs,
  PlaywrightWorkerOptions,
} from '@playwright/test';

import {
  ExtractablePropertiesOfScreen,
  InScreenFn,
  PlaywrightScreenOpener,
} from './types.js';

export interface NgxPlaywrightTestArgs {
  /**
   * Open the given screen
   */
  open: PlaywrightScreenOpener;

  /**
   * Harness environment for the active page
   */
  harnessEnvironment: PlaywrightHarnessEnvironment;

  /**
   * [experimental] Open the given screen and execute the given function
   */
  inScreen: InScreenFn;

  /**
   * Fixture to set up automatic stabilization on all pages
   *
   * @internal
   */
  _setupAutomaticStabilization: void;
}

export interface NgxPlaywrightTestOptions {
  /**
   * Whether automatic waiting for the angular app to become stable is enabled by default
   *
   * Setting this to true (which is the default) makes all elements created in all environments automatically wait.
   * Waiting is done before anything is read from the page, and after anything is done to the page.
   *
   * Setting this to false disables this behavior, requiring manual stabilization when needed.
   *
   * This only influences the main page. Manual stabilization is always required on secondary pages.
   */
  enableAutomaticStabilization: boolean;
}

export type PlaywrightTestConfig<
  // eslint-disable-next-line @typescript-eslint/ban-types
  TestArgs = {},
  // eslint-disable-next-line @typescript-eslint/ban-types
  WorkerArgs = {},
> = BaseTestConfig<NgxPlaywrightTestOptions & TestArgs, WorkerArgs>;

export type NgxPlaywrightScreenTestArgs<C extends ComponentHarness> = {
  /**
   * The screen instance
   */
  screen: C;

  /**
   * A special fixture that has to be destructured in the parameter of the test
   *
   * The destructured properties of the `$` fixture are made available in the fixture. Accessing the
   * `$` fixture without destructuring or using rest properties is not supported and will yield
   * undefined property values.
   *
   * This fixture is not available to other fixtures, it can only be used in the test function.
   */
  $: ExtractablePropertiesOfScreen<C>;
};

export type NgxPlaywrightFixtures = Fixtures<
  NgxPlaywrightTestArgs & NgxPlaywrightTestOptions,
  // eslint-disable-next-line @typescript-eslint/ban-types
  {},
  PlaywrightTestArgs & PlaywrightTestOptions,
  PlaywrightWorkerArgs & PlaywrightWorkerOptions
>;

export type NgxPlaywrightScreenFixtures<C extends ComponentHarness> = Fixtures<
  NgxPlaywrightScreenTestArgs<C>,
  // eslint-disable-next-line @typescript-eslint/ban-types
  {},
  NgxPlaywrightTestArgs &
    NgxPlaywrightTestOptions &
    PlaywrightTestArgs &
    PlaywrightTestOptions,
  PlaywrightWorkerArgs & PlaywrightWorkerOptions
>;
