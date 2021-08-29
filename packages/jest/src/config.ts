import type {Test} from 'jest-runner';
import merge from 'lodash.merge';

import {
  BrowserSpec,
  BrowserName,
  RunnerBrowserSpec,
  LaunchType,
} from './browsers';

export interface NgxPlaywrightJestTest extends Test {
  context: Test['context'] & {
    config: Test['context']['config'] & {
      runnerSpec: RunnerBrowserSpec;
    };
  };
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface PartialNgxPlaywrightJestConfig extends BrowserSpec {}

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends
    | string
    | boolean
    | number
    | symbol
    | null
    | undefined
    ? T[K]
    : DeepPartial<T[K]>;
};

export interface NgxPlaywrightJestConfig
  extends Partial<PartialNgxPlaywrightJestConfig> {
  debugOptions?: DeepPartial<PartialNgxPlaywrightJestConfig>;
  browsers?: (
    | BrowserName
    | (Partial<PartialNgxPlaywrightJestConfig> & Pick<BrowserSpec, 'type'>)
  )[];
}

const defaultBrowserSpec: BrowserSpec = {
  type: BrowserName.Chromium,
  launchType: LaunchType.Launch,
};

const defaultConfig: NgxPlaywrightJestConfig &
  Pick<Required<NgxPlaywrightJestConfig>, 'debugOptions' | 'browsers'> = {
  ...defaultBrowserSpec,

  debugOptions: {
    slowMo: 250,
    // Increase the command timeout in case the user is debugging
    timeout: 7 * 24 * 60 * 60 * 1000, // one week

    launchOptions: {
      devtools: true,
      headless: false,
    },

    persistentContextOptions: {
      devtools: true,
      headless: false,
    },
  },

  browsers: [BrowserName.Chromium],
};

export function getBrowserSpecs(
  config: NgxPlaywrightJestConfig,
  isDebug?: boolean,
): BrowserSpec[] {
  const resolvedConfig = merge({}, defaultConfig, config);

  const browsers =
    typeof resolvedConfig.type === 'string'
      ? [resolvedConfig as BrowserSpec]
      : (resolvedConfig.browsers ?? defaultConfig.browsers).map(browser =>
          typeof browser === 'string'
            ? (merge({}, resolvedConfig, {type: browser}) as BrowserSpec)
            : (merge({}, resolvedConfig, browser) as BrowserSpec),
        );

  if (!isDebug || resolvedConfig.debugOptions == null) {
    return browsers;
  }

  return browsers.map(browser => merge(browser, resolvedConfig.debugOptions));
}
