/* spell-checker: disable */
import {parallel} from '@angular/cdk/testing';
import {test, expect} from '@ngx-playwright/test';

import {MainComponentHarness} from '../harnesses/app-component-harness';

test.describe('PlaywrightHarnessEnvironment', () => {
  test.beforeEach(async ({page}) => {
    await page.goto('/');
  });

  test.describe('environment specific', () => {
    test.describe('ComponentHarness', () => {
      let harness: MainComponentHarness;

      test.beforeEach(async ({harnessEnvironment}) => {
        harness = await harnessEnvironment.getHarness(MainComponentHarness);
      });

      test('it can get elements outside of host', async () => {
        const globalEl = await harness.globalEl();
        expect(await globalEl.text()).toBe('I am a sibling!');
      });

      test('it should get correct text excluding certain selectors', async () => {
        const results = await harness.subcomponentAndSpecialHarnesses();
        const subHarnessHost = await results[0]!.host();

        expect(await subHarnessHost.text({exclude: 'h2'})).toBe(
          'ProtractorTestBedOther',
        );
        expect(await subHarnessHost.text({exclude: 'li'})).toBe(
          'List of test tools',
        );
      });

      test('it should be able to retrieve the WebElement from a WebDriverElement', async ({
        harnessEnvironment,
      }) => {
        const element = harnessEnvironment.getPlaywrightHandle(
          await harness.host(),
        );
        expect(
          (
            await (await element.getProperty('tagName')).jsonValue()
          ).toLowerCase(),
        ).toBe('test-main');
      });
    });

    test.describe('shadow DOM interaction', () => {
      test('it should pierce shadow boundary by default', async ({
        harnessEnvironment,
      }) => {
        expect(harnessEnvironment.respectShadowBoundaries).toBe(false);

        const harness = await harnessEnvironment.getHarness(
          MainComponentHarness,
        );
        const shadows = await harness.shadows();
        expect(
          await parallel(() => {
            return shadows.map(el => el.text());
          }),
        ).toEqual(['Shadow 1', 'Shadow 2']);
      });

      test('it should respect shadow boundaries when `respectShadowBoundaries` is set to true', async ({
        harnessEnvironment,
      }) => {
        const harness = await harnessEnvironment
          .withOptions({respectShadowBoundaries: true})
          .getHarness(MainComponentHarness);
        expect(await harness.shadows()).toEqual([]);
      });

      test('it should allow querying across shadow boundary', async ({
        harnessEnvironment,
      }) => {
        const harness = await harnessEnvironment.getHarness(
          MainComponentHarness,
        );
        expect(await (await harness.deepShadow()).text()).toBe('Shadow 2');
      });
    });
  });

  test.describe('change detection', () => {
    test('it should wait for stability by default', async ({
      harnessEnvironment,
    }) => {
      const harness = await harnessEnvironment.getHarness(MainComponentHarness);
      const asyncCounter = await harness.asyncCounter();
      expect(await asyncCounter.text()).toBe('5');
      await harness.increaseCounter(3);
      expect(await asyncCounter.text()).toBe('8');
    });

    const manualTest = test.extend<{}>({
      enableAutomaticStabilization: false,
    });

    manualTest(
      'it should not wait for stability when disabled',
      async ({harnessEnvironment}) => {
        const harness = await harnessEnvironment.getHarness(
          MainComponentHarness,
        );
        const asyncCounter = await harness.asyncCounter();
        expect(await asyncCounter.text()).toBe('0');
        await harnessEnvironment.forceStabilize();
        expect(await asyncCounter.text()).toBe('5');
        await harness.increaseCounter(3);
        expect(await asyncCounter.text()).toBe('5');
        await harnessEnvironment.forceStabilize();
        expect(await asyncCounter.text()).toBe('8');
      },
    );
  });
});
