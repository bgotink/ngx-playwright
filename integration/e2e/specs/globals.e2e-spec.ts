describe('globals', () => {
  it('should have browser', () => {
    expect(browser).toBeDefined();
    expect(browser.contexts).toBeDefined();
    expect(browser.close).toEqual(expect.any(Function));
  });

  it('should have browserContext', () => {
    expect(browserContext).toBeDefined();
    expect(browserContext.browser).toEqual(expect.any(Function));
    expect(browserContext.close).toEqual(expect.any(Function));
  });

  it('should have page', () => {
    expect(page).toBeDefined();
    expect(page.viewportSize).toEqual(expect.any(Function));
    expect(page.close).toEqual(expect.any(Function));
  });

  test('should have harnessEnvironment and getHandle', async () => {
    expect(harnessEnvironment).toBeDefined();
    expect(harnessEnvironment.getHarness).toEqual(expect.any(Function));

    expect(harnessEnvironment.rootElement).toBeDefined();

    expect(getHandle).toBeDefined();

    const rootHandle = getHandle(harnessEnvironment.rootElement);

    await expect(
      (await rootHandle.getProperty('tagName')).jsonValue(),
    ).resolves.toBe('HTML');
  });

  it('should have baseUrl', async () => {
    expect(baseUrl).toEqual(expect.any(String));

    await page.goto(baseUrl);
    await expect(page.title()).resolves.toBe('Integration Jests');
  });
});
