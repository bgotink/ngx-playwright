import {getBrowserType} from '../get-browser-type';
import {BrowserSpec, BrowserLauncher, LaunchType} from '../types';

import {ConnectLauncher} from './connect';
import {LaunchLauncher} from './launch';
import {PersistentContextLauncher} from './persistent-context';

export function getLauncher(spec: BrowserSpec): BrowserLauncher {
  switch (spec.launchType) {
    case LaunchType.Connect:
      return new ConnectLauncher(spec);
    case LaunchType.PersistentContext:
      return new PersistentContextLauncher(spec);
    case LaunchType.Launch:
    case undefined:
    case null:
      return new LaunchLauncher(getBrowserType(spec), spec);
    default:
      throw new Error(`Invalid launchType: ${JSON.stringify(spec.launchType)}`);
  }
}
