describe('globals', () => {
  it('should have browser', () => {
    expect(typeof browser).not.toBe('undefined');
    expect(browser.contexts).toBeDefined();
    expect(browser.close).toEqual(expect.any(Function));
  });

  it('should have browserContext', () => {
    expect(typeof browserContext).not.toBe('undefined');
    expect(browserContext.browser).toEqual(expect.any(Function));
    expect(browserContext.close).toEqual(expect.any(Function));
  });

  it('should have page', () => {
    expect(typeof page).not.toBe('undefined');
    expect(page.viewportSize).toEqual(expect.any(Function));
    expect(page.close).toEqual(expect.any(Function));
  });

  it('should have change detection functions', () => {
    expect(typeof autoStabilize).not.toBe('undefined');
    expect(typeof manuallyStabilize).not.toBe('undefined');
  });

  test('should have harnessEnvironment', async () => {
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

  it('should have baseUrl', async () => {
    expect(baseUrl).toEqual(expect.any(String));

    await page.goto(baseUrl);
    await expect(page.title()).resolves.toBe('Integration Jests');
  });
});
