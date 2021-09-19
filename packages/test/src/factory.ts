import {ComponentHarness, parallel} from '@angular/cdk/testing';
import type {
  Fixtures,
  PlaywrightTestArgs,
  PlaywrightTestOptions,
  PlaywrightWorkerArgs,
  PlaywrightWorkerOptions,
  TestType,
} from '@playwright/test';

import {
  NgxPlaywrightTestArgs,
  NgxPlaywrightTestOptions,
  test,
} from './fixtures';
import {getDestructured$Argument} from './parse-arguments';
import type {
  ExtractablePropertiesOfScreen,
  ExtractablePropertyNamesOfScreen,
  PlaywrightScreen,
} from './screen';

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

function createScreenFixtures<C extends ComponentHarness>(
  Screen: PlaywrightScreen<C>,
): Fixtures<
  NgxPlaywrightScreenTestArgs<C>,
  // eslint-disable-next-line @typescript-eslint/ban-types
  {},
  NgxPlaywrightTestArgs &
    NgxPlaywrightTestOptions &
    PlaywrightTestArgs &
    PlaywrightTestOptions,
  PlaywrightWorkerArgs & PlaywrightWorkerOptions
> {
  return {
    screen: async ({open}, use) => use(await open(Screen)),

    $: async ({screen}, use, testInfo) => {
      const propertyNames = getDestructured$Argument(testInfo.fn) as
        | ExtractablePropertyNamesOfScreen<C>[]
        | null;

      if (propertyNames == null) {
        await use({} as ExtractablePropertiesOfScreen<C>);
      } else {
        const entries = await parallel(() =>
          propertyNames.map(async name => {
            const value: ExtractablePropertiesOfScreen<C>[ExtractablePropertyNamesOfScreen<C>] =
              await screen[name]?.();

            return [name, value] as const;
          }),
        );

        await use(
          Object.fromEntries(entries) as ExtractablePropertiesOfScreen<C>,
        );
      }
    },
  };
}

export function mixinScreenFixtures<
  C extends ComponentHarness,
  T extends NgxPlaywrightTestArgs &
    NgxPlaywrightTestOptions &
    PlaywrightTestArgs &
    PlaywrightTestOptions,
  W extends PlaywrightWorkerArgs & PlaywrightWorkerOptions,
>(
  Screen: PlaywrightScreen<C>,
  test: TestType<T, W>,
): TestType<NgxPlaywrightScreenTestArgs<C> & T, W> {
  return test.extend(createScreenFixtures(Screen));
}

/**
 * Creates a `test` function
 *
 * Tests defined using the returned function have access to two extra fixtures:
 *
 * - `screen` is the instance of Screen
 * - `$` is a special fixture that has to be destructured in the parameter, which will make those
 *   destructured properties available. Accessing extra properties later on or using rest properties
 *   is not supported and will yield undefined values.
 *
 * @param Screen The screen class to run the test in
 * @returns A test function to use for tests in the given screen
 */
// The return type is very complex, typescript is more than capable of inferring it
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function createTest<C extends ComponentHarness>(
  Screen: PlaywrightScreen<C>,
) {
  return mixinScreenFixtures(Screen, test);
}
