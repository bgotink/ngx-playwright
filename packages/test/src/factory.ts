import {ComponentHarness, parallel} from '@angular/cdk/testing';

import {test} from './fixtures';
import {getDestructured$Argument} from './parse-arguments';
import type {
  ExtractablePropertiesOfScreen,
  ExtractablePropertyNamesOfScreen,
  PlaywrightScreen,
} from './screen';

export type NgxPlaywrightScreenFixtures<T extends ComponentHarness> = {
  /**
   * The screen instance
   */
  screen: T;

  /**
   * A special fixture that has to be destructured in the parameter of the test
   *
   * The destructured properties of the `$` fixture are made available in the fixture. Accessing the
   * `$` fixture without destructuring or using rest properties is not supported and will yield
   * undefined property values.
   *
   * This fixture is not available to other fixtures, it can only be used in the test function.
   */
  $: ExtractablePropertiesOfScreen<T>;
};

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
export function createTest<T extends ComponentHarness>(
  Screen: PlaywrightScreen<T>,
) {
  return test.extend<NgxPlaywrightScreenFixtures<T>>({
    screen: async ({open}, use) => use(await open(Screen)),

    $: async ({screen}, use, testInfo) => {
      const propertyNames = getDestructured$Argument(
        testInfo.fn,
      ) as ExtractablePropertyNamesOfScreen<T>[];

      if (propertyNames == null) {
        await use({} as ExtractablePropertiesOfScreen<T>);
      } else {
        const entries = await parallel(() =>
          propertyNames.map(async name => {
            // @ts-expect-error typescript doesn't realise ExtractablePropertiesOfScreen<T> is indexable by keyof T
            const value: ExtractablePropertiesOfScreen<T>[keyof T] =
              await screen[name]?.();

            return [name, value] as const;
          }),
        );

        await use(
          Object.fromEntries(entries) as ExtractablePropertiesOfScreen<T>,
        );
      }
    },
  });
}
