import type {
  ConnectOptions,
  LaunchOptions,
  BrowserContextOptions,
  Browser,
  BrowserContext,
} from 'playwright-core';

export {LaunchOptions, ConnectOptions};

export type PersistentContextOptions = Omit<
  LaunchOptions & BrowserContextOptions,
  'storageState' | 'firefoxUserPrefs'
> & {userDataDir: string};

export const enum BrowserName {
  Chromium = 'chromium',
  Firefox = 'firefox',
  Webkit = 'webkit',
}

const ALL_BROWSERS: ReadonlySet<BrowserName> = new Set([
  BrowserName.Chromium,
  BrowserName.Firefox,
  BrowserName.Webkit,
]);

export function isValidBrowserName(value: unknown): value is BrowserName {
  return ALL_BROWSERS.has(value as BrowserName);
}

export const enum LaunchType {
  Launch = 'launch',
  PersistentContext = 'persistent context',
  Connect = 'connect',
}

const ALL_LAUNCH_TYPES: ReadonlySet<LaunchType> = new Set([
  LaunchType.Launch,
  LaunchType.PersistentContext,
  LaunchType.Connect,
]);

export function isValidLaunchType(value: unknown): value is LaunchType {
  return ALL_LAUNCH_TYPES.has(value as LaunchType);
}

export interface BrowserSpec {
  readonly name?: string;
  readonly type: BrowserName;
  readonly launchType?: LaunchType;

  readonly launchOptions?: Omit<LaunchOptions, 'logger' | 'slowMo' | 'timeout'>;
  readonly connectOptions?: Omit<
    ConnectOptions,
    'logger' | 'slowMo' | 'timeout'
  >;
  readonly persistentContextOptions?: Omit<
    PersistentContextOptions,
    'logger' | 'slowMo' | 'timeout'
  >;

  readonly slowMo?: LaunchOptions['slowMo'];
  readonly timeout?: LaunchOptions['timeout'];
}

export interface BrowserLauncher {
  getSpec(): RunnerBrowserSpec;

  setup?(): Promise<void>;

  teardown?(): Promise<void>;
}

/**
 * Object that gets sent to the test runner process
 */
export interface RunnerBrowserSpec {
  readonly name?: string;
  readonly type: BrowserName;
  readonly launchType: LaunchType.Connect | LaunchType.PersistentContext;

  readonly connectOptions?: BrowserSpec['connectOptions'];
  readonly persistentContextOptions?: BrowserSpec['persistentContextOptions'];

  readonly slowMo?: LaunchOptions['slowMo'];
  readonly timeout?: LaunchOptions['timeout'];
}

export interface RunnerBrowserLauncher {
  setup(): Promise<void>;

  teardown(): Promise<void>;

  getBrowserName(): BrowserName;

  getBrowser(): Browser;

  resetBrowser(): Promise<void>;

  getBrowserContext(): BrowserContext;

  resetBrowserContext(): Promise<void>;
}
