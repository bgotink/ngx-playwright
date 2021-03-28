import type {Browser, BrowserServer, BrowserType} from 'playwright-core';
import {
  BrowserLauncher,
  BrowserSpec,
  LaunchType,
  RunnerBrowserSpec,
} from '../types';

export class LaunchLauncher implements BrowserLauncher {
  readonly #options: Parameters<BrowserType<unknown>['launchServer']>[0];
  readonly #spec: RunnerBrowserSpec;

  readonly #browserType: BrowserType<Browser>;
  #browser?: BrowserServer;

  constructor(browserType: BrowserType<Browser>, spec: BrowserSpec) {
    this.#browserType = browserType;
    this.#options = {
      ...spec.launchOptions,
      timeout: spec.timeout,
    };

    this.#spec = {
      name: spec.name,
      type: spec.type,
      launchType: LaunchType.Connect,
      slowMo: spec.slowMo,
      timeout: spec.timeout,
    };
  }

  getSpec(): RunnerBrowserSpec {
    if (this.#browser == null) {
      throw new Error(`Call setup() first`);
    }

    return {
      ...this.#spec,
      connectOptions: {
        wsEndpoint: this.#browser.wsEndpoint(),
      },
    };
  }

  async setup() {
    if (this.#browser == null) {
      this.#browser = await this.#browserType.launchServer(this.#options);
    }
  }

  async teardown() {
    await this.#browser?.close();
  }
}
