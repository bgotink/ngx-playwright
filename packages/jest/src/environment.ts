import type {HarnessEnvironment, TestElement} from '@angular/cdk/testing';
import type {Config, Global} from '@jest/types';
import NodeEnvironment from 'jest-environment-node';
import type {
  Browser,
  BrowserContext,
  ElementHandle,
  Page,
} from 'playwright-core';

import {
  BrowserName,
  getRunnerLauncher,
  RunnerBrowserLauncher,
} from './browsers';
import type {NgxPlaywrightJestTest} from './config';

interface PlaywrightJestGlobal {
  browserName: BrowserName;

  browser: Browser;

  browserContext: BrowserContext;

  page: Page;

  harnessEnvironment: HarnessEnvironment<unknown>;

  getHandle(element: TestElement): ElementHandle;
}

export class PlaywrightEnvironment extends NodeEnvironment {
  #runner: RunnerBrowserLauncher;
  #baseUrl: string;

  global!: Global.Global & PlaywrightJestGlobal;

  constructor(
    config: Config.ProjectConfig & NgxPlaywrightJestTest['context']['config'],
  ) {
    super(config);

    this.#baseUrl = config.testURL;
    this.#runner = getRunnerLauncher(config.runnerSpec);
  }

  async setup(): Promise<void> {
    await super.setup();
    const runner = this.#runner;

    await runner.setup();

    const browserContext = runner.getBrowserContext();
    const page = await browserContext.newPage();

    Object.defineProperties(this.global, {
      baseUrl: {
        configurable: true,
        writable: false,
        value: this.#baseUrl,
      },
      browserName: {
        configurable: true,
        writable: false,
        value: runner.getBrowserName(),
      },
      browser: {
        configurable: true,
        get() {
          return runner.getBrowser();
        },
      },
      browserContext: {
        configurable: true,
        writable: false,
        value: browserContext,
      },
      page: {
        configurable: true,
        writable: false,
        value: page,
      },
    });
  }

  async teardown(): Promise<void> {
    await this.#runner.teardown();

    await super.teardown();
  }
}
