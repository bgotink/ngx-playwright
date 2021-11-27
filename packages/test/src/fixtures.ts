import {
  PlaywrightHarnessEnvironment,
  createEnvironment,
  autoStabilize,
  manuallyStabilize,
} from '@ngx-playwright/harness';
import {
  test as base,
  PlaywrightTestConfig as BaseTestConfig,
  Fixtures,
  PlaywrightTestOptions,
  PlaywrightWorkerOptions,
  PlaywrightTestArgs,
  PlaywrightWorkerArgs,
  TestType,
  TestFixture,
} from '@playwright/test';

import {
  PlaywrightScreenOpener,
  openScreen,
  InScreenFn,
  createInScreenFn,
} from './screen';

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

const ngxPlaywrightFixtures: Fixtures<
  NgxPlaywrightTestArgs & NgxPlaywrightTestOptions,
  // eslint-disable-next-line @typescript-eslint/ban-types
  {},
  PlaywrightTestArgs & PlaywrightTestOptions,
  PlaywrightWorkerArgs & PlaywrightWorkerOptions
> = {
  enableAutomaticStabilization: true,

  _setupAutomaticStabilization: [
    ({enableAutomaticStabilization}, use) => {
      if (enableAutomaticStabilization) {
        autoStabilize();
      } else {
        manuallyStabilize();
      }

      return use();
    },
    {auto: true},
  ],

  // Not sure why cast is necessary, but without it typescript fails to recognize any types in the
  // value of the inScreen property
  inScreen: (({page, baseURL, harnessEnvironment}, use) => {
    return use(createInScreenFn(page, harnessEnvironment, baseURL));
  }) as TestFixture<
    InScreenFn,
    NgxPlaywrightTestArgs &
      NgxPlaywrightTestOptions &
      PlaywrightTestArgs &
      PlaywrightTestOptions &
      PlaywrightWorkerArgs &
      PlaywrightWorkerOptions
  >,

  open: ({page, baseURL, harnessEnvironment}, use) =>
    use(screen => openScreen(baseURL, page, harnessEnvironment, screen)),

  harnessEnvironment: ({page}, use) => use(createEnvironment(page)),

  context: async ({context}, use) => {
    await context.addInitScript({
      path: require.resolve('@ngx-playwright/harness/zone-patch'),
    });

    return use(context);
  },
};

export function mixinFixtures<
  T extends PlaywrightTestArgs & PlaywrightTestOptions,
  W extends PlaywrightWorkerArgs & PlaywrightWorkerOptions,
>(
  test: TestType<T, W>,
): TestType<NgxPlaywrightTestArgs & NgxPlaywrightTestOptions & T, W> {
  return test.extend(ngxPlaywrightFixtures);
}

export const test = mixinFixtures(base);
