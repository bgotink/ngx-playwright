import {
  BrowserLauncher,
  BrowserSpec,
  LaunchType,
  RunnerBrowserSpec,
} from '../types';

export class ConnectLauncher implements BrowserLauncher {
  #spec: RunnerBrowserSpec;

  constructor(spec: BrowserSpec) {
    if (!spec.connectOptions?.wsEndpoint) {
      throw new Error(
        `Invalid ${spec.type} browser: connectOptions.wsEndpoint is required`,
      );
    }

    this.#spec = {
      name: spec.name,
      type: spec.type,
      launchType: LaunchType.Connect,
      connectOptions: spec.connectOptions,
      slowMo: spec.slowMo,
      timeout: spec.timeout,
    };
  }

  getSpec(): RunnerBrowserSpec {
    return this.#spec;
  }
}
