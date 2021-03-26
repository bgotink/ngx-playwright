import type {Config} from '@jest/types';

export type JestConfig = Partial<
  Pick<
    Config.Argv,
    | 'cache'
    | 'changedFilesWithAncestor'
    | 'changedSince'
    | 'ci'
    | 'clearCache'
    | 'config'
    | 'colors'
    | 'debug'
    | 'detectOpenHandles'
    | 'expand'
    | 'findRelatedTests'
    | 'forceExit'
    | 'json'
    | 'lastCommit'
    | 'listTests'
    | 'logHeapUsage'
    | 'maxConcurrency'
    | 'maxWorkers'
    | 'noStackTrace'
    | 'onlyChanged'
    | 'outputFile'
    | 'passWithNoTests'
    | 'runInBand'
    | 'runTestsByPath'
    | 'showConfig'
    | 'silent'
    | 'testLocationInResults'
    | 'testNamePattern'
    | 'testPathPattern'
    | 'updateSnapshot'
    | 'useStderr'
    | 'verbose'
    | 'version'
    | 'watch'
    | 'watchAll'
    | 'watchman'
  >
>;

export interface Schema extends JestConfig {
  /**
   * A dev-server builder target to run tests against in the format of `target` or `[project]:target[:configuration]`. You can also pass in more than one configuration name as a comma-separated list. Example: `project:target:production,staging`.
   */
  readonly devServerTarget?: string;

  /**
   * Base URL for playwright to connect to.
   */
  readonly baseUrl?: string;

  /**
   * Host to listen on
   */
  readonly host?: string;

  /**
   * The port to use to serve the application
   */
  readonly port?: number;
}
