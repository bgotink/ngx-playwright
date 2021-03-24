import {LaunchType, RunnerBrowserLauncher, RunnerBrowserSpec} from '../types';

import {ConnectRunnerLauncher} from './connect';
import {PersistentContextRunnerLauncher} from './persistent-context';

export function getRunnerLauncher(
  spec: RunnerBrowserSpec,
): RunnerBrowserLauncher {
  switch (spec.launchType) {
    case LaunchType.Connect:
      return new ConnectRunnerLauncher(spec);
    case LaunchType.PersistentContext:
      return new PersistentContextRunnerLauncher(spec);
    default:
      throw new Error(
        `Invalid launch type: ${JSON.stringify(spec.launchType)}`,
      );
  }
}
