import type {Browser, BrowserContext, BrowserType} from 'playwright-core';

import {getBrowserType} from '../get-browser-type';
import type {
  RunnerBrowserLauncher,
  RunnerBrowserSpec,
  BrowserName,
} from '../types';

export class PersistentContextRunnerLauncher implements RunnerBrowserLauncher {
  #type: BrowserType<Browser>;
  #browserContext?: BrowserContext;

  #userDataDir: string;
  #options: Parameters<BrowserType<Browser>['launchPersistentContext']>[1];

  constructor(spec: RunnerBrowserSpec) {
    const {userDataDir, ...options} = spec.persistentContextOptions ?? {};

    if (!userDataDir) {
      throw new Error(
        `Invalid ${spec.type} browser: persistentContextOptions.userDataDir is required`,
      );
    }

    this.#type = getBrowserType(spec);

    this.#userDataDir = userDataDir;
    this.#options = {
      ...options,
      slowMo: spec.slowMo,
      timeout: spec.timeout,
    };
  }

  // Replace with private method once typescript supports it
  #assertSetup = () => {
    if (this.#browserContext == null) {
      throw new Error(`setup() must be called and awaited`);
    }
  };

  async setup(): Promise<void> {
    if (this.#browserContext == null) {
      this.#browserContext = await this.#type.launchPersistentContext(
        this.#userDataDir,
        this.#options,
      );
    }
  }

  async teardown(): Promise<void> {
    await this.#browserContext?.close();
    this.#browserContext = undefined;
  }

  getBrowserName(): BrowserName {
    return this.#type.name() as BrowserName;
  }

  getBrowser(): Browser {
    throw new Error(
      'There is no `browser` value when using the PersistenContext launch type',
    );
  }

  async resetBrowser(): Promise<void> {
    await this.resetBrowserContext();
  }

  getBrowserContext(): BrowserContext {
    this.#assertSetup();

    return this.#browserContext!;
  }

  async resetBrowserContext(): Promise<void> {
    this.#assertSetup();

    await this.teardown();
    await this.setup();
  }
}
