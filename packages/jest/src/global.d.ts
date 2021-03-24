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

  const harnessEnvironment: import('@angular/cdk/testing').HarnessEnvironment<unknown>;

  function getHandle(
    element: import('@angular/cdk/testing').TestElement,
  ): import('playwright-core').ElementHandle<HTMLElement | SVGElement>;
}

export {};
