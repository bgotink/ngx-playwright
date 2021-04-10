import {parallel} from '@angular/cdk/testing';
// import {
//   waitForAngularReady,
//   WebDriverHarnessEnvironment,
// } from '@angular/cdk/testing';
import {crossEnvironmentSpecs} from './cross-environment-specs';
import {MainComponentHarness} from '../harnesses/app-component-harness';

describe('PlaywrightHarnessEnvironment', () => {
  async function getUrl(path: string) {
    await page.goto(`${baseUrl}${path}`);
    // await waitForAngularReady();
  }

  beforeEach(async () => {
    await getUrl('/');
    // await harnessEnvironment.forceStabilize();
  });

  describe('environment specific', () => {
    describe('ComponentHarness', () => {
      let harness: MainComponentHarness;

      beforeEach(async () => {
        harness = await harnessEnvironment.getHarness(MainComponentHarness);
      });

      it('can get elements outside of host', async () => {
        const globalEl = await harness.globalEl();
        expect(await globalEl.text()).toBe('I am a sibling!');
      });

      it('should get correct text excluding certain selectors', async () => {
        const results = await harness.subcomponentAndSpecialHarnesses();
        const subHarnessHost = await results[0]!.host();

        expect(await subHarnessHost.text({exclude: 'h2'})).toBe(
          'ProtractorTestBedOther',
        );
        expect(await subHarnessHost.text({exclude: 'li'})).toBe(
          'List of test tools',
        );
      });

      it('should be able to retrieve the WebElement from a WebDriverElement', async () => {
        const element = getHandle(await harness.host());
        expect(
          (
            await (await element.getProperty('tagName')).jsonValue()
          ).toLowerCase(),
        ).toBe('test-main');
      });
    });

    describe.skip('shadow DOM interaction', () => {
      it('should not pierce shadow boundary by default', async () => {
        const harness = await harnessEnvironment.getHarness(
          MainComponentHarness,
        );
        expect(await harness.shadows()).toEqual([]);
      });

      it('should pierce shadow boundary when using piercing query', async () => {
        const harness = await harnessEnvironment /* with query function `piercingQueryFn` */
          .getHarness(MainComponentHarness);
        const shadows = await harness.shadows();
        expect(
          await parallel(() => {
            return shadows.map(el => el.text());
          }),
        ).toEqual(['Shadow 1', 'Shadow 2']);
      });

      it('should allow querying across shadow boundary', async () => {
        const harness = await harnessEnvironment /* with query function `piercingQueryFn` */
          .getHarness(MainComponentHarness);
        expect(await (await harness.deepShadow()).text()).toBe('Shadow 2');
      });
    });
  });

  describe('environment independent', () =>
    crossEnvironmentSpecs(
      () => harnessEnvironment,
      () => harnessEnvironment.getHarness(MainComponentHarness),
      async () => page.evaluate(() => document.activeElement?.id ?? null),
    ));
});
