import {
  BrowserLauncher,
  BrowserSpec,
  LaunchType,
  RunnerBrowserSpec,
} from '../types';

export class PersistentContextLauncher implements BrowserLauncher {
  #spec: RunnerBrowserSpec;

  constructor(spec: BrowserSpec) {
    if (!spec.persistentContextOptions?.userDataDir) {
      throw new Error(
        `Invalid ${spec.type} browser: persistentContextOptions.userDataDir is required`,
      );
    }

    this.#spec = {
      name: spec.name,
      type: spec.type,
      launchType: LaunchType.PersistentContext,
      persistentContextOptions: spec.persistentContextOptions,
      slowMo: spec.slowMo,
      timeout: spec.timeout,
    };
  }

  getSpec(): RunnerBrowserSpec {
    return this.#spec;
  }
}
