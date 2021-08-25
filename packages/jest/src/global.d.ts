declare global {
  type BrowserName = 'chromium' | 'firefox' | 'webkit';

  type DeviceDescriptor =
    typeof import('playwright-core').devices extends (infer T)[] ? T : never;

  type DeviceType = string | {name: string} | DeviceDescriptor;

  type LaunchType = 'launch' | 'persistent' | 'server';

  /**
   * The base URL the app being tested is hosted at
   */
  const baseUrl: string;

  /**
   * The active browser's name
   */
  const browserName: BrowserName;

  /**
   * The browser instance the active `page` is created in
   */
  const browser: import('playwright-core').Browser;

  /**
   * The browser context the `page` was created in
   */
  const browserContext: import('playwright-core').BrowserContext;

  /**
   * The active page
   */
  const page: import('playwright-core').Page;

  /**
   * Harness environment for the active page
   */
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
   * Returns a function that executes the given function with auto stabilization turned on
   */
  function autoStabilize(fn: () => Promise<any>): () => Promise<any>;
  /**
   * Returns a function that executes the given function with auto stabilization turned on
   */
  function autoStabilize(fn: () => any): () => any;

  /**
   * Stop automatically waiting for the angular application to become stable
   *
   * Call {@link #forceStabilize} to manually wait until the app stabilizes.
   */
  function manuallyStabilize(): void;
  /**
   * Returns a function that executes the given function with auto stabilization turned off
   */
  function manuallyStabilize(fn: () => Promise<any>): () => Promise<any>;
  /**
   * Returns a function that executes the given function with auto stabilization turned off
   */
  function manuallyStabilize(fn: () => any): () => any;

  /**
   * [experimental] Open the given screen and execute the given function
   *
   * @param page Page to open the screen in
   * @param screen The screen to open
   * @param fn Function to execute once the given screen is opened
   */
  function inScreen<T extends import('@angular/cdk/testing').ComponentHarness>(
    page: import('playwright-core').Page,
    screen: import('@ngx-playwright/jest').PlaywrightScreen<T>,
    fn: (
      props: import('@ngx-playwright/jest').ExtractablePropertiesOfScreen<T>,
      screen: T,
    ) => void | Promise<void>,
  ): () => Promise<void>;
  /**
   * [experimental] Open the given screen and execute the given function
   *
   * @param screen The screen to open
   * @param fn Function to execute once the given screen is opened
   */
  function inScreen<T extends import('@angular/cdk/testing').ComponentHarness>(
    screen: import('@ngx-playwright/jest').PlaywrightScreen<T>,
    fn: (
      props: import('@ngx-playwright/jest').ExtractablePropertiesOfScreen<T>,
      screen: T,
    ) => void | Promise<void>,
  ): () => Promise<void>;
}

export {};
