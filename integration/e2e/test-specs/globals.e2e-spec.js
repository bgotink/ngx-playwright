import {mixinFixtures} from '@bgotink/playwright-coverage';
import {test as base, expect} from '@ngx-playwright/test';

const test = mixinFixtures(base);

test.describe.parallel('fixtures', () => {
  test('it should have browser', ({browser}) => {
    expect(typeof browser).not.toBe('undefined');
    expect(browser.contexts).toBeDefined();
    expect(browser.close).toEqual(expect.any(Function));
  });

  test('it should have context', ({context}) => {
    expect(typeof context).not.toBe('undefined');
    expect(context.browser).toEqual(expect.any(Function));
    expect(context.close).toEqual(expect.any(Function));
  });

  test('it should have page', ({page}) => {
    expect(typeof page).not.toBe('undefined');
    expect(page.viewportSize).toEqual(expect.any(Function));
    expect(page.close).toEqual(expect.any(Function));
  });

  test('it should have harnessEnvironment', async ({harnessEnvironment}) => {
    expect(typeof harnessEnvironment).not.toBe('undefined');
    expect(harnessEnvironment.getHarness).toEqual(expect.any(Function));

    expect(harnessEnvironment.rootElement).toBeDefined();

    const rootHandle = await harnessEnvironment.getPlaywrightHandle(
      harnessEnvironment.rootElement,
    );

    await expect(
      (await rootHandle.getProperty('tagName')).jsonValue(),
    ).resolves.toBe('HTML');
  });

  test('it should have baseURL', async ({baseURL, page}) => {
    expect(baseURL).toEqual(expect.any(String));

    await page.goto(/** @type {string} */ (baseURL));
    await expect(page.title()).resolves.toBe('Integration Tests');
  });
});
