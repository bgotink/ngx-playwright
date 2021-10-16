import type {Config as JestConfig} from '@jest/types';
import Runner, {
  OnTestFailure,
  OnTestStart,
  OnTestSuccess,
  Test,
  TestRunnerContext,
  TestRunnerOptions,
  TestWatcher,
} from 'jest-runner';

import {
  BrowserLauncher,
  BrowserSpec,
  getCacheKey,
  getLauncher,
  RunnerBrowserSpec,
} from './browsers';
import {
  getBrowserSpecs as _getBrowserSpecs,
  NgxPlaywrightJestConfig,
  NgxPlaywrightJestTest,
} from './config';

function isDebug(): boolean {
  return !!process.env.PWDEBUG;
}

function getDefaultTimeout(): number {
  // Use 1 week if debugging is enabled, otherwise default to 15 seconds
  return isDebug() ? 7 * 24 * 60 * 60 * 1000 : 15_000;
}

const browserSpecsCache = new WeakMap<NgxPlaywrightJestConfig, BrowserSpec[]>();
function getBrowserSpecs(config: NgxPlaywrightJestConfig) {
  let browsers = browserSpecsCache.get(config);

  if (browsers == null) {
    browsers = _getBrowserSpecs(config, isDebug());
    browserSpecsCache.set(config, browsers);
  }

  return browsers;
}

async function getLauncherConfig(
  config: NgxPlaywrightJestConfig,
  launchersByKey: Map<string, BrowserLauncher>,
): Promise<RunnerBrowserSpec[]> {
  const browsers = getBrowserSpecs(config);

  const launchers = await Promise.all(
    browsers.map(async browser => {
      const cacheKey = getCacheKey(browser);
      let launcher = launchersByKey.get(cacheKey);

      if (launcher == null) {
        launcher = getLauncher(browser);
        launchersByKey.set(cacheKey, launcher);
      }

      await launcher.setup?.();

      return launcher;
    }),
  );

  return launchers.map(launcher => launcher.getSpec());
}

async function expandTests(
  tests: Test[],
  launchersByKey: Map<string, BrowserLauncher>,
): Promise<NgxPlaywrightJestTest[]> {
  return (
    await Promise.all(
      tests.map(async test => {
        const browsers = await getLauncherConfig(
          test.context.config.testEnvironmentOptions,
          launchersByKey,
        );

        return browsers.map(browser => ({
          ...test,
          context: {
            ...test.context,
            config: {
              ...test.context.config,
              runnerSpec: browser,

              ...(browsers.length > 1
                ? {
                    displayName: {
                      name: test.context.config.displayName
                        ? `${browser.name ?? browser.type} ${
                            test.context.config.displayName.name
                          }`
                        : browser.name ?? browser.type,
                      color: test.context.config.displayName?.color ?? 'yellow',
                    },
                  }
                : {}),
            },
          },
        }));
      }),
    )
  ).flat();
}

/**
 * Run tests over multiple browsers
 */
export class PlaywrightRunner extends Runner {
  constructor(
    globalConfig: JestConfig.GlobalConfig,
    context: TestRunnerContext,
  ) {
    super(
      {
        ...globalConfig,
        // Overrule Jest's defaults for the timeout
        testTimeout: globalConfig.testTimeout ?? getDefaultTimeout(),
      },
      context,
    );
  }

  override async runTests(
    tests: Test[],
    watcher: TestWatcher,
    onStart: OnTestStart,
    onResult: OnTestSuccess,
    onFailure: OnTestFailure,
    options: TestRunnerOptions,
  ): Promise<void> {
    const launchersByKey = new Map<string, BrowserLauncher>();

    const allTests = await expandTests(tests, launchersByKey);

    try {
      return await super.runTests(
        allTests,
        watcher,
        onStart,
        onResult,
        onFailure,
        options,
      );
    } finally {
      await Promise.all(
        Array.from(launchersByKey.values(), launcher =>
          launcher.teardown?.().catch(() => {
            // ignore errors in the teardown
          }),
        ),
      );
    }
  }
}
