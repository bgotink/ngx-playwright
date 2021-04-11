declare global {
  type BrowserName = 'chromium' | 'firefox' | 'webkit';

  type DeviceDescriptor = typeof import('playwright-core').devices extends (infer T)[]
    ? T
    : never;

  type DeviceType = string | {name: string} | DeviceDescriptor;

  type LaunchType = 'launch' | 'persistent' | 'server';

  const baseUrl: string;

  const browserName: BrowserName;

  const browser: import('playwright-core').Browser;

  const browserContext: import('playwright-core').BrowserContext;

  const page: import('playwright-core').Page;

  const harnessEnvironment: import('@ngx-playwright/harness').PlaywrightHarnessEnvironment;

  /**
   * Automatically wait for the angular application to be come stable
   *
   * Calling this function makes all elements created in all environments
   * automatically wait. Waiting is done before anything is read from the page,
   * and after anything is done to the page.
   *
   * The environment automatically waits for stabilization by default, unless
   * {@link #manuallyStabilize} is called.
   */
  function autoStabilize(): void;

  /**
   * Stop automatically waiting for the angular application to become stable
   *
   * Call {@link #forceStabilize} to manually wait until the app stabilizes.
   */
  function manuallyStabilize(): void;
}

export {};
