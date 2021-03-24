import type {
  Browser,
  BrowserContext,
  BrowserType,
  ConnectOptions,
} from 'playwright-core';

import {getBrowserType} from '../get-browser-type';
import type {
  RunnerBrowserLauncher,
  RunnerBrowserSpec,
  BrowserName,
} from '../types';

export class ConnectRunnerLauncher implements RunnerBrowserLauncher {
  #type: BrowserType<Browser>;
  #browser?: Browser;
  #browserContext?: BrowserContext;

  #options: ConnectOptions;

  constructor(spec: RunnerBrowserSpec) {
    if (!spec.connectOptions?.wsEndpoint) {
      throw new Error(
        `Invalid ${spec.type} browser: connectOptions.wsEndpoint is required`,
      );
    }

    this.#type = getBrowserType(spec);

    this.#options = {
      wsEndpoint: spec.connectOptions.wsEndpoint,
      slowMo: spec.slowMo,
      timeout: spec.timeout,
    };
  }

  // Replace with private method once typescript supports it
  #assertSetup = () => {
    if (this.#browser == null) {
      throw new Error(`setup() must be called and awaited`);
    }
  };

  async setup(): Promise<void> {
    if (this.#browser != null) {
      return;
    }

    const browser = await this.#type.connect(this.#options);

    this.#browserContext = await browser.newContext();
    this.#browser = browser;
  }

  async teardown(): Promise<void> {
    await this.#browserContext?.close();
    await this.#browser?.close();

    this.#browserContext = undefined;
    this.#browser = undefined;
  }

  getBrowserName(): BrowserName {
    return this.#type.name() as BrowserName;
  }

  getBrowser(): Browser {
    this.#assertSetup();
    return this.#browser!;
  }

  async resetBrowser(): Promise<void> {
    this.#assertSetup();

    await this.teardown();
    await this.setup();
  }

  getBrowserContext(): BrowserContext {
    this.#assertSetup();
    return this.#browserContext!;
  }

  async resetBrowserContext(): Promise<void> {
    this.#assertSetup();

    await this.#browserContext!.close();
    this.#browserContext = await this.#browser!.newContext();
  }
}
