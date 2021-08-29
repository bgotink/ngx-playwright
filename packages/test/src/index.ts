import {ComponentHarness, parallel} from '@angular/cdk/testing';
import {
  PlaywrightHarnessEnvironment,
  createEnvironment,
  autoStabilize,
  manuallyStabilize,
} from '@ngx-playwright/harness';
import {
  Page,
  test as base,
  PlaywrightTestConfig as BaseTestConfig,
} from '@playwright/test';

import {getDestructuredArguments} from './parse-arguments';
import {
  PlaywrightScreen,
  PlaywrightScreenOpener,
  ExtractablePropertiesOfScreen,
  openScreen,
} from './screen';

export * from '@playwright/test';

export interface NgxPlaywrightFixtures {
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

  /**
   * @internal
   */
  _setupAutomaticStabilization: void;

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
   *
   * @param page Page to open the screen in
   * @param screen The screen to open
   * @param fn Function to execute once the given screen is opened
   */
  inScreen<T extends ComponentHarness>(
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
  inScreen<T extends ComponentHarness>(
    screen: PlaywrightScreen<T>,
    fn: (
      props: ExtractablePropertiesOfScreen<T>,
      screen: T,
    ) => void | Promise<void>,
  ): Promise<void>;
}

// eslint-disable-next-line @typescript-eslint/ban-types
type PlaywrightTestConfig<TestArgs = {}, WorkerArgs = {}> = BaseTestConfig<
  NgxPlaywrightFixtures & TestArgs,
  WorkerArgs
>;

const test = base.extend<NgxPlaywrightFixtures>({
  enableAutomaticStabilization: true,

  _setupAutomaticStabilization: [
    async ({enableAutomaticStabilization, page}, use) => {
      if (enableAutomaticStabilization) {
        autoStabilize(() => page);
        try {
          await use();
        } finally {
          manuallyStabilize();
        }
      } else {
        manuallyStabilize();
        await use();
      }
    },
    {auto: true},
  ],

  open: async ({page, baseURL, harnessEnvironment}, use) =>
    use(screen => openScreen(baseURL, page, harnessEnvironment, screen)),

  harnessEnvironment: ({page}, use) => use(createEnvironment(page)),

  inScreen: ({baseURL, page, harnessEnvironment}, use) => {
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
            const value: ExtractablePropertiesOfScreen<T>[keyof T] =
              await screen[name]?.();

            return [name, value] as const;
          }),
        );

        await testFunction(
          Object.fromEntries(properties) as ExtractablePropertiesOfScreen<T>,
          screen,
        );
      }
    }

    return use(inScreen);
  },
});

export {
  PlaywrightScreen,
  PlaywrightHarnessEnvironment,
  PlaywrightTestConfig,
  test,
};
